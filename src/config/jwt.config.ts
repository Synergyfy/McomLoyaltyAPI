
export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET || 'yourSecretKey',
    expiresIn: '60m',
  },
});
