document.addEventListener('DOMContentLoaded', function() {

    const form = document.querySelector('#post-form');

    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            const url = form.getAttribute('data-url');
            const body = document.querySelector('#post-body').value;
            const csrftoken = getCookie('csrftoken');
            console.log("hey", body); 

            fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({
                "body": body
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log("success:", data);
            alert('Post posted');
        })
            document.querySelector('#post-body').value = '';
        })
    }
  })
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

