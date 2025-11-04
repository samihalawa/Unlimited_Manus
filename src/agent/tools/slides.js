/**
 * Slides tool for creating presentation decks
 * Creates a basic deck from markdown content
 */

const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');

const buildSlidesMeta = (extra = {}) => ({
  action_type: 'slides.create',
  tool: 'slides',
  ...extra,
});

const Slides = {
  name: "slides",
  description: "Create a presentation slide deck. Provide slide count and path to markdown file with slide content. Creates HTML presentation in conversation workspace.",
  params: {
    type: "object",
    properties: {
      brief: {
        description: "A one-sentence preamble describing the purpose of this operation",
        type: "string"
      },
      slide_content_file_path: {
        description: "Path to markdown file in sandbox containing the detailed slide content outline",
        type: "string"
      },
      slide_count: {
        description: "Total number of slides in the presentation",
        type: "number"
      }
    },
    required: ["slide_count", "slide_content_file_path"]
  },
  memorized: false,
  
  async getActionDescription(args) {
    const { slide_count, brief } = args;
    if (brief) return brief;
    return `Creating ${slide_count}-slide presentation`;
  },
  
  async execute(args, uuid, context) {
    const { slide_count, slide_content_file_path } = args;
    const title = 'Presentation';
    
    try {
      // Resolve content file path
      let contentPath = slide_content_file_path;
      if (!path.isAbsolute(contentPath) && context.workspace_dir) {
        contentPath = path.join(context.workspace_dir, contentPath);
      }
      
      // Read slide content
      let markdown;
      try {
        markdown = await fs.readFile(contentPath, 'utf-8');
      } catch (err) {
        return {
          status: 'failure',
          content: `Could not read slide content file: ${slide_content_file_path}`,
          meta: buildSlidesMeta({ error: 'missing_source' })
        };
      }
      
      // Split content into slides (by --- or ___)
      const slideContents = markdown.split(/^(?:---|___)\s*$/m).filter(s => s.trim());
      
      if (slideContents.length === 0) {
        return {
          status: 'failure',
          content: 'No slide content found. Separate slides with "---" or "___"',
          meta: buildSlidesMeta({ error: 'no_content' })
        };
      }
      
      // Convert each slide from markdown to HTML
      const slides = await Promise.all(
        slideContents.slice(0, slide_count).map(async (content) => {
          return marked(content.trim());
        })
      );
      
      // Create HTML presentation
      const html = generatePresentationHTML(title, slides);
      
      // Save to workspace
      const outputDir = context.workspace_dir || process.cwd();
      const outputPath = path.join(outputDir, `presentation_${uuid.substring(0, 8)}.html`);
      
      await fs.writeFile(outputPath, html, 'utf-8');
      
      return {
        status: 'success',
        content: `Created presentation with ${slides.length} slides\nSaved to: ${outputPath}`,
        meta: buildSlidesMeta({
          filepath: outputPath,
          slide_count: slides.length,
          title,
          json: { path: outputPath, slides: slides.length }
        })
      };
    } catch (error) {
      console.error('Slides tool error:', error);
      return {
        status: 'failure',
        content: `Slide creation failed: ${error.message}`,
        meta: buildSlidesMeta({ error: true })
      };
    }
  }
};

/**
 * Generate HTML for presentation
 */
function generatePresentationHTML(title, slides) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #000;
      color: #fff;
      overflow: hidden;
    }
    .slide-container {
      width: 100vw;
      height: 100vh;
      position: relative;
    }
    .slide {
      position: absolute;
      width: 100%;
      height: 100%;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .slide.active {
      display: flex;
    }
    .slide-content {
      max-width: 900px;
      width: 100%;
    }
    .slide-content h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .slide-content h2 {
      font-size: 2.5rem;
      margin-bottom: 0.8rem;
    }
    .slide-content h3 {
      font-size: 2rem;
      margin-bottom: 0.6rem;
    }
    .slide-content p {
      font-size: 1.5rem;
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    .slide-content ul, .slide-content ol {
      font-size: 1.4rem;
      line-height: 1.8;
      margin-left: 2rem;
    }
    .slide-content code {
      background: rgba(255,255,255,0.1);
      padding: 0.2rem 0.5rem;
      border-radius: 3px;
    }
    .controls {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      display: flex;
      gap: 1rem;
      z-index: 100;
    }
    .controls button {
      background: rgba(255,255,255,0.2);
      border: none;
      color: #fff;
      padding: 0.8rem 1.5rem;
      border-radius: 5px;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.3s;
    }
    .controls button:hover {
      background: rgba(255,255,255,0.3);
    }
    .slide-number {
      position: fixed;
      bottom: 2rem;
      left: 2rem;
      font-size: 1.2rem;
      color: rgba(255,255,255,0.7);
    }
  </style>
</head>
<body>
  <div class="slide-container">
${slides.map((content, idx) => `    <div class="slide${idx === 0 ? ' active' : ''}" data-slide="${idx}">
      <div class="slide-content">
${content}
      </div>
    </div>`).join('\n')}
  </div>
  
  <div class="slide-number">
    <span id="current">1</span> / <span id="total">${slides.length}</span>
  </div>
  
  <div class="controls">
    <button id="prev">Previous</button>
    <button id="next">Next</button>
  </div>
  
  <script>
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;
    
    function showSlide(n) {
      slides.forEach(s => s.classList.remove('active'));
      currentSlide = (n + totalSlides) % totalSlides;
      slides[currentSlide].classList.add('active');
      document.getElementById('current').textContent = currentSlide + 1;
    }
    
    document.getElementById('prev').addEventListener('click', () => {
      showSlide(currentSlide - 1);
    });
    
    document.getElementById('next').addEventListener('click', () => {
      showSlide(currentSlide + 1);
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') showSlide(currentSlide - 1);
      if (e.key === 'ArrowRight') showSlide(currentSlide + 1);
    });
  </script>
</body>
</html>`;
}

module.exports = Slides;
