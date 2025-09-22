export default {
  server: '120.55.85.213',
  apiKey: 'D9RmU7w6GUD3t5GDHsqlGF5pII6VW9NlBUYJk2z2VqU28jfuFGXST8jNE2HkU2es',
  async connect() {
    const authResponse = await fetch(`http://${this.server}:8081/api-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: this.apiKey
      })
    });
    console.log('authResponse:', authResponse)
  },


}
