const User = require('../models/User');

const seeder = async () => {
  try {
    const adminExists = await User.findOne({ username: 'admin' }).select('_id').lean();
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@trainticket.com',
        password: 'admin123',
        role: 'ROLE_ADMIN',
      });
      console.log('✅ Default Admin user created: admin / admin123');
    }
  } catch (err) {
    console.error('Seeder error:', err.message);
  }
};

module.exports = seeder;
