require('module-alias/register');
require('dotenv').config();

const Platform = require('./src/models/Platform');
const Model = require('./src/models/Model');
const DefaultModelSetting = require('./src/models/DefaultModelSetting');

const checkDatabase = async () => {
  try {
    console.log('📊 Checking database state...\n');

    // Check platforms
    const platforms = await Platform.findAll();
    console.log(`📍 Platforms (${platforms.length}):`);
    platforms.forEach(p => {
      console.log(`  - ${p.name} (enabled: ${p.is_enabled}, api_key: ${p.api_key ? '✓' : '✗'})`);
    });

    // Check models
    const models = await Model.findAll();
    console.log(`\n🤖 Models (${models.length}):`);
    models.forEach(m => {
      console.log(`  - ${m.model_id} (${m.model_name})`);
    });

    // Check default settings
    const settings = await DefaultModelSetting.findAll();
    console.log(`\n⚙️  Default Model Settings (${settings.length}):`);
    if (settings.length === 0) {
      console.log('  - None configured');
    }
    settings.forEach(s => {
      console.log(`  - User ${s.user_id}: ${s.model_id}`);
    });

    console.log('\n✅ Database check complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    process.exit(1);
  }
};

checkDatabase();
