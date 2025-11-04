/**
 * 工具调用提示模板生成器
 * 根据工具目录中的工具定义生成工具调用的提示模板
 */
const toolsOld = require("@src/tools/index");
const agentTools = require("@src/agent/tools/index");

// Merge old tools and new agent tools
const tools = { ...toolsOld, ...agentTools };

/**
 * 生成工具列表的提示模板
 * @returns {Promise<string>} 工具列表的提示模板
 */
const resolveToolPrompt = async () => {

  let toolDescription = "";
  // 遍历所有工具并生成它们的描述
  for (const [toolName, tool] of Object.entries(tools)) {
    if (!tool || !tool.name || !tool.description || !tool.params) {
      console.warn(`工具 ${toolName} 定义不完整，跳过`);
      continue;
    }
    // 格式化工具定义为JSON字符串
    const toolDefinition = {
      description: tool.description,
      name: tool.name,
      params: tool.params
    };
    // 添加工具定义到提示中
    toolDescription += `<tool ${tool.name}>
${JSON.stringify(toolDefinition)}
</tool>
`;
  }
  // 使用模板字符串构建工具提示
  const prompt = `<tools>
<tool_list>
You are provided with tools to complete user's task and proposal. Here is a list of tools you can use:
${toolDescription}
<tool finish>
{ "description": "Signal that a task is complete and provide a completion message", "name": "finish", "params": { "type": "object", "properties": { "message": { "description": "Explanation of the task completion result", "type": "string" } }, "required": ["message"] } }
</tool>
</tool_list>

<tool_call_guidelines>
Follow these guidelines regarding tool calls:

GENERAL GUIDELINES:
- You MUST only use the tools explicitly provided in the tool list. Do not treat file names or code functions as tool names.
- The conversation history or tool_call history may refer to tools that are no longer available. NEVER call tools that are not explicitly provided.
- Prioritize mcp_tool when available, then other tools. MCP tools provide more accurate information.

TASK PLANNING (plan tool):
- MUST use plan.update at the start of new tasks to create a structured plan with goal and phases.
- Phase count scales with complexity: simple (2), typical (4-6), complex (10+).
- MUST use plan.advance when current phase is complete and ready for next phase.
- next_phase_id MUST be sequential (current_phase_id + 1). No skipping or going backward.

USER COMMUNICATION (message tool):
- MUST use message tool for ALL user-visible communication instead of direct responses.
- Use info type for progress updates and acknowledgments.
- Use ask type to request user input (blocks execution until response).
- Use result type to deliver final results with attachments.

Available tool names:
- ${Object.keys(tools).join('\n  - ')}
- finish
</tool_call_guidelines>

</tools>`;

  return prompt;
}

module.exports = resolveToolPrompt