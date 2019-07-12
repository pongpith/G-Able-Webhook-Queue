const request = require('request-promise');
const lineapi = require('../../linemessage.json');

const replyMessage = (msg, replyToken, response) => {
  return request({
    method: `POST`,
    uri: `${lineapi.LINE_MESSAGING_API}/reply`,
    headers: lineapi.LINE_HEADER,
    body: JSON.stringify({
      replyToken: replyToken,
      messages: [
        {
          type: `text`,
          text: msg,
        },
      ],
    }),
  }).then(() => {
    return response.status(200).end();
  }).catch((error) => {
    console.error(error);
    return response.status(500).end();
  });
};

module.exports = replyMessage;
