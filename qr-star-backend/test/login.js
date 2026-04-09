const axios = require("axios");
const passwords = require("../utils/password.js");

axios
  .get("http://localhost:3000/api/users/auth", {
    headers: {
      username: "admin",
      password: passwords.hmacHash(
        "yV8jrTVebfSDmzRqRmG2N8ak4xD0Wlvx4RfQB0yJCJ5mL31HaH"
      ),
    },
  })
  .then((response) => {
    const data = response.data;
    if (data.error) {
      console.error("Error:", data.message);
    } else {
      // console.log("Authentication successful, token:", data.message);
      axios
        .get("http://localhost:3000/api/users/me", {
          headers: { login: data.message },
        })
        .then((userResponse) => {
          const userData = userResponse.data;
          if (userData.error) {
            console.error("Error fetching user info:", userData.message);
          } else {
            console.log("User Info:", userData);
            axios
              .post(
                "http://localhost:3000/api/links/create",
                {
                  linkid: "testing",
                  content: "https://google.com/?utm_source=korabi",
                },
                { headers: { login: data.message } }
              )
              .then((res) => {
                if (res.data.error) {
                  console.warn(res.data.message);
                } else {
                  console.log(res.data.message);
                }
              });
          }
        })
        .catch((err) => {
          console.error("Error fetching user info:", err.message);
        });
    }
  });
