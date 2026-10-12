exports.BasePage = class BasePage {
  constructor(page) {
    this.page = page;
  }

  async openPageWithLocalStorageToken(pagePath, token) {
    await this.page.goto('icons/qa-guru-logo.svg');
    const key = await this.authTokenKey();
    await this.page.evaluate(([k, t]) => localStorage.setItem(k, t), [key, token]);
    await this.page.goto(pagePath);
  }

  async authTokenKey() {
    return this.page.evaluate(() => {
      const m = location.pathname.match(/\/(backend-[^/]+)\//);
      return m ? `authToken:${m[1]}` : 'authToken';
    });
  }

  async authToken() {
    const key = await this.authTokenKey();
    return this.page.evaluate((k) => localStorage.getItem(k), key);
  }
};
