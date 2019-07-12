const request = require('request-promise');
const replyMessage = require('./common/replyMessage');

const getQueList = (userId, replyToken, response) => {
  return request({
    method: `GET`,
    uri: `https://webapi.linequeuegable.dev.nextliving.co/officer/checkdetailofficer/${userId}`,
    json: true,
  }).then((res) => {
    const valid = `${res.valid}`;
    if (valid === `YES`) {
      const hwid = `${res.hwid}`;
      return replyMessage(`https://webapi.linequeuegable.dev.nextliving.co/officer/listque/${hwid}`, replyToken, response);
    }
    return replyMessage(`คุณไม่มีสิทธิ์เข้าถึง`, replyToken, response);
  }).catch((error) => {
    console.error(error);
    return response.status(500).end();
  });
};

module.exports = getQueList;
