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
    load_posts('all-posts');
  });

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

function load_posts(view) {
  // div not a button
    const container = document.querySelector('#view-content');
    container.innerHTML = '';
    // const formView = document.querySelector('#new-post-view');

    container.innerHTML = `<h3>${view.replace('-', ' ').toUpperCase()}</h3>`;
    
    if (view === 'all-posts') {
      fetch('/all_posts')
      .then(response => response.json())

      .then(posts => {
        posts.forEach(post => {  
              const postDiv = document.createElement('div');
              postDiv.className = "card my-2 p-3 shadow-sm";

              postDiv.innerHTML = `
              <div class="d-flex justify-content-between">
              <strong>@${post.user}</strong>
              <small class="text-muted">${post.timestamp}</small>
              </div>
              <div class="mt-2">${post.body}</div>
              <div class="mt-2 text-primary">
                ♥️ ${post.likes}
                </div>
              `;
              container.append(postDiv)
            });
          })
          .catch(error => console.error('Error fetching Posts:', error));
}
}



