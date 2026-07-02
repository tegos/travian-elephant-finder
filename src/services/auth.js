const axiosDefaultInstance = require('#src/libs/axiosDefault.js');
const config = require('#src/config/index.js');

function parseJwtFromSetCookie(setCookieHeader) {
  if (!setCookieHeader) return null;
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  const jwtCookie = cookies.find((entry) => /^JWT=/.test(entry));
  return jwtCookie ? jwtCookie.split(';')[0].trim() : null;
}

const Auth = function Auth() {
  this.login = async function login() {
    const { server, login: username, password } = config.travian;

    const loginResponse = await axiosDefaultInstance.post(`${server}/api/v1/auth/login`, {
      name: username,
      password,
      w: '1280:720',
      mobileOptimizations: false,
    });

    const { code } = loginResponse.data || {};
    if (!code) {
      throw new Error('Travian login failed: no auth code returned from /api/v1/auth/login');
    }

    const redirectResponse = await axiosDefaultInstance.get(`${server}/api/v1/auth`, {
      params: { code, response_type: 'redirect' },
      maxRedirects: 0,
      validateStatus: (status) => status < 400,
    });

    const jwtCookie = parseJwtFromSetCookie(redirectResponse.headers['set-cookie']);
    if (!jwtCookie) {
      throw new Error('Travian login failed: no JWT cookie returned from /api/v1/auth');
    }

    config.setCookie(jwtCookie);
    return jwtCookie;
  };

  this.isSessionValid = async function isSessionValid() {
    const cookie = config.getCookie();
    if (!cookie) return false;

    try {
      const response = await axiosDefaultInstance.get(`${config.travian.server}/dorf1.php`, {
        maxRedirects: 0,
        validateStatus: (status) => status < 400,
        headers: { cookie },
      });
      return response.status === 200;
    } catch (_error) {
      return false;
    }
  };

  this.ensureAuthenticated = async function ensureAuthenticated() {
    if (await this.isSessionValid()) return;
    await this.login();
  };
};

const auth = new Auth();
auth.parseJwtFromSetCookie = parseJwtFromSetCookie;

module.exports = auth;
