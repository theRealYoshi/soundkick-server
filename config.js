module.exports = {
  database: process.env.MONGO_URI || 'mongodb://soundkickDevAdmin:Yoshihiro1@ds013366.mlab.com:13366/soundkick-dev',
  mongoStore: process.env.SESSION_MONGO_URI || 'mongodb://soundkickDevSessionAdmin:Yoshihiro1@ds013486.mlab.com:13486/soundkick-dev-session'
};
