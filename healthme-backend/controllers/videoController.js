const twilio = require('twilio');
const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

exports.videoToken = async (req, res) => {
  const { roomName } = req.body;
  
  const identity = req.user.email;

  if (!roomName) {
    return res.status(400).json({ message: 'roomName is required' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY_SID;
  const apiSecret = process.env.TWILIO_API_KEY_SECRET;

  const token = new AccessToken(accountSid, apiKey, apiSecret, { identity });

  const videoGrant = new VideoGrant({
    room: roomName,
  });
  token.addGrant(videoGrant);

  res.json({ token: token.toJwt() });
};