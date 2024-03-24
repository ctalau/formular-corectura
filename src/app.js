const clientId = '918261874955-582fgr09r7cdei3fsski7oj0l45pvf4i.apps.googleusercontent.com';
var redirectUrl = 'http://localhost:8000';
var scopes = 'https://www.googleapis.com/auth/forms.body';
var accessToken = '';


var successForm = document.getElementById('success');

// If we have an access token URL param, present the form, otherwise present the login button
if (window.location.href.includes('access_token')) {
    // Hide the login button
    document.getElementById('authorize').style.display = 'none';
    // Show the form
    document.getElementById('createForm').style.display = 'block';

    // Get the access token from the URL in a variable and remove it from the URL
    accessToken = window.location.href.split('access_token=')[1].split('&')[0];
    // window.history.pushState({}, document.title, window.location.pathname);

} else {
    // Show the login button
    document.getElementById('authorize').style.display = 'block';
    // Hide the form
    document.getElementById('createForm').style.display = 'none';
}

function authorize(e) {
    e.preventDefault();
    var authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${redirectUrl}&response_type=token&scope=${scopes}`;
    // Open the authorization URL in the current browser tab
    window.open(authUrl, '_self');
}
document.getElementById('authorize').addEventListener('click', authorize);

async function createEmptyFormWithTitle(title) {
    // Use raw HTTP requests (fetch API) to create the form
    let response = await fetch('https://forms.googleapis.com/v1/forms', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            info: {
                title,
            }
        })
    });
    if (response.status === 200) {
        // Parse the response JSON
        let data = await response.json();
        return {
            formId: data.formId,
            responderUri: data.responderUri
        };
    } else {
        let errorMessage = await response.text();
        alert(errorMessage);
        throw new Error('Error creating form');
    }
}

function createTextItem(title, required, long, position) {
    return {
        "createItem": {
            "item": {
                "title": title,
                "questionItem": {
                    "question": {
                        "required": required,
                        "textQuestion": {
                            "paragraph": long
                        }
                    }
                }
            },
            "location": {
                "index": position
            }
        }
    };
}

function createRequiredSingleChoice(title, choices, position) {
    return {
        "createItem": {
            "item": {
                "title": title,
                "questionItem": {
                    "question": {
                        "choiceQuestion": {
                            "type": "RADIO",
                            "options": choices.map(choice => ({ "value": "" + choice }))
                        },
                        "required": true
                    }
                }
            },
            "location": {
                "index": position
            }
        }
    };
}
async function addQuestions(formId, codes) {
    var requests = [];
    requests.push(createTextItem("Nume corector", true, false, 0));
    requests.push(createRequiredSingleChoice("Problema", [1,2,3,4], 1));
    
    for (var i = 0; i < codes.length; i++) {
        requests.push(createTextItem("Punctaj " + codes[i], true, false, 2*i + 2));
        requests.push(createTextItem("Comentarii la punctajul " + codes[i], false, true, 2*i + 3));
    }
    requests.push({
        "updateFormInfo": {
            "info": {
                "title": "Gh. Titeica 2024 - corectare clasa a " + document.getElementById('clasa').value + "-a",
                "description": "Pentru a putea centraliza mai usor rezultatele, vom trece aici punctajele acordate la fiecare lucrare.\n\n" +
                    "Punctajele sunt in intevalul 0-7.\n\n"+
                    "Pe langa punctaj, fiecare lucrare are o sectiune de comentarii unde putem trece probleme pe care le-am observat in legatura cu solutia."
            },
            "updateMask": "title,description"
        }
    });
    // Add a question to the form
    let response = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({requests})
    });

    if (response.status !== 200) {
        let errorMessage = await response.text();
        alert(errorMessage);
        throw new Error('Error adding question to form');
    }
}

async function createForm(e) {
    e.preventDefault();
    let title = 'Gh. Titeica 2024 - corectare clasa a ' + document.getElementById('clasa').value + '-a';
    let { formId, responderUri } = await createEmptyFormWithTitle(title);

    var codes = document.getElementById('codes').value.split('\n')
        .map(code => code.trim())
        .map(code => 'CNC'+ code)
    await addQuestions(formId, codes);

    document.getElementById('success').style.display = 'block';

    successForm.innerHTML = `<p>Form created successfully!`+ 
    `<p><a href="https://docs.google.com/forms/d/${formId}/edit">Edit form</a>` +
    `<p><a href="${responderUri}">Share form</a>`;
    successForm.style.display = 'block';
}
document.getElementById('createForm').addEventListener('submit', createForm);