const request = require('request-promise');
const lineapi = require('../linemessage.json');

const replyWelcomeMessage = (replyToken, response) => {
  return request({
    method: `POST`,
    uri: `${lineapi.LINE_MESSAGING_API}/reply`,
    headers: lineapi.LINE_HEADER,
    body: JSON.stringify({
      replyToken: replyToken,
      messages: [
        {
          type: 'imagemap',
          baseUrl: 'https://suthinanhome.files.wordpress.com/2019/06/w1-1.jpg?w=1040',
          altText: 'G-Able Career Day 2019',
          baseSize: {
            width: 1040,
            height: 1040,
          },
          actions: [],
        },
        {
          type: 'imagemap',
          baseUrl: 'https://suthinanhome.files.wordpress.com/2019/06/w2-2.jpg?w=1040',
          altText: 'การเปิดใช้งาน Line Beacon',
          baseSize: {
            width: 1040,
            height: 783,
          },
          actions: [
            {
              type: 'uri',
              area: {
                x: 3,
                y: 3,
                width: 1032,
                height: 775,
              },
              linkUri: 'https://linegable-api.pod.in.th/gableapi/public/helpbeacon/',
            },
          ],
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

module.exports = replyWelcomeMessage;
