const axios = require('axios')
const { initInstance, getEnv, updateCkEnv } = require('./qlApi.js')
const notify = require('./sendNotify')

const domain = 'https://ikuuu.eu';
const checkinURL = domain + '/user/checkin';

async function getEmailAndPassword() {

  let instance = null
  try {
    instance = await initInstance()
  } catch (e) {}

  let ikuuu = process.env.ikuuu || []
  try {
    if (instance) ikuuu = await getEnv(instance, 'ikuuu')
  } catch (e) {}

  let ikuuuUserArray = [];
    if (Array.isArray(ikuuu)) ikuuuUserArray = ikuuu

  else if (process.env.ikuuu.indexOf('\n') > -1) {
    console.log(123);
    ikuuuUserArray = process.env.ikuuu.split('\n');
  }
  else {
    ikuuuUserArray = [process.env.ikuuu];
  }
  console.log('共找到' + ikuuuUserArray.length + '个账号');
  if (ikuuuUserArray.length == 0) {
    console.log("没有找到账号");
    process.exit(1);
  }
      console.log(ikuuuUserArray);
  return ikuuuUserArray;
}
async function getCookies(email, password) {
  return new Promise((cookie) => {
    const loginURL = domain + '/auth/login?email=' + email + '&passwd=' + password;
    axios.post(loginURL)
      .then(function (response) {
        if (response.data.ret == 0) {
          console.log('登录错误：' + response.data.msg);
          process.exit(1);
        }
        console.log(email + response.data.msg)
        let array = response.headers['set-cookie'];
        let keyArray = array[2].split("; ");
        let expireArray = array[4].split("; ");
        let uidArray = array[0].split("; ");
        let cookieStr = keyArray[0] + '; ' + expireArray[0] + ';' + uidArray[0] + '; email=' + email + ';';
        cookie(cookieStr);
      })
      .catch(function (error) {
        console.log(error);
      });
  })

}

async function signIn(eamil, cookie) {
  return new Promise((msg) => {
    const sendMessage = [];
    axios.defaults.headers.common['Cookie'] = cookie;
    axios.post(checkinURL)
      .then(function (res) {
        sendMessage.push(eamil + res.data.msg);
        console.log(eamil + res.data.msg);
      })
      .catch(function (error) {
        console.log("错误信息:" + error);
      })
    // sendMessage.push('-----------------------------------------');
    msg(sendMessage.join(','));
  })

}

!(async () => {
  const ikuuuUserArray = await getEmailAndPassword();
  const allMessage = [];
  for await (user of ikuuuUserArray) {
    const eamil = user.value.split('&')[0];
    const password = user.value.split('&')[1];
    console.log('1')
    const cookieStr = await getCookies(eamil, password);
    const msg = await signIn(eamil, cookieStr);
    console.log('2');
  }
  // await notify.sendNotify(`ikuuu签到`, allMessage.join('\n'))
})()
