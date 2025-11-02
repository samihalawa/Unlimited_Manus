require('module-alias/register');
require('dotenv').config();

const Model = require('./src/models/Model');

const getModelIds = async () => {
  try {
    const gemini_flash = await Model.findOne({ where: { model_id: 'gemini-2.0-flash' } });
    const gemini_pro = await Model.findOne({ where: { model_id: 'gemini-1.5-pro' } });
    const lemon = await Model.findOne({ where: { model_id: 'lemon' } });

    console.log('📋 Model IDs in Database:');
    if (gemini_flash) console.log(`   gemini-2.0-flash: ID ${gemini_flash.id}`);
    if (gemini_pro) console.log(`   gemini-1.5-pro: ID ${gemini_pro.id}`);
    if (lemon) console.log(`   lemon: ID ${lemon.id}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

getModelIds();
