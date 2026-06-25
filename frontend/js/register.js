const form =
document.getElementById("registerForm");

form.addEventListener(
    "submit",
    async (e) => {

        e.preventDefault();

        const nama =
            document.getElementById("nama").value;

        const email =
            document.getElementById("email").value;

        const password =
            document.getElementById("password").value;

        const response =
            await fetch(
                "http://localhost:5000/api/auth/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                        "application/json"
                    },

                    body: JSON.stringify({
                        nama,
                        email,
                        password
                    })
                }
            );

        const data =
            await response.json();

        alert(data.message);

        if(response.ok){

            window.location.href =
                "login.html";

        }

    }
);