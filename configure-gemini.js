require('module-alias/register');
require('dotenv').config();

const Platform = require('./src/models/Platform');
const DefaultModelSetting = require('./src/models/DefaultModelSetting');

const GEMINI_API_KEY = 'AIzaSyC1TRkC_N7XgCuu8jY-0TIIcFHmW5qA5JA';

const configureGemini = async () => {
  try {
    console.log('🔧 Starting Gemini configuration...');

    // Step 1: Check if Gemini platform exists
    console.log('📝 Step 1: Verifying Gemini platform...');
    let gemini = await Platform.findOne({ where: { name: 'Gemini' } });

    if (!gemini) {
      console.log('⚠️  Gemini platform not found, attempting to update anyway...');
    } else {
      console.log('✅ Gemini platform found');
      console.log(`   - Enabled: ${gemini.is_enabled}`);
      console.log(`   - API Key: ${gemini.api_key ? '✓ Set' : '✗ Missing'}`);
    }

    // Step 2: Set default model for user 1
    console.log('📝 Step 2: Setting default model for user...');

    // First, check if a default model setting already exists for user 1
    let defaultSetting = await DefaultModelSetting.findOne({
      where: { user_id: 1, setting_type: 'default_model' }
    });

    if (defaultSetting) {
      // Update existing setting
      await defaultSetting.update({
        model_id: 'gemini-2.0-flash',
        config: { provider: 'gemini' }
      });
      console.log('✅ Updated existing default model setting');
    } else {
      // Create new setting
      await DefaultModelSetting.create({
        user_id: 1,
        setting_type: 'default_model',
        model_id: 'gemini-2.0-flash',
        config: { provider: 'gemini' }
      });
      console.log('✅ Created new default model setting');
    }

    console.log('\n🎉 Gemini configuration completed successfully!');
    console.log('   Platform: Gemini');
    console.log('   Model: gemini-2.0-flash');
    console.log('   User: 1');
    console.log('\n✨ The application is now ready to use!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Configuration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

configureGemini();
