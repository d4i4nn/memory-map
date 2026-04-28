document.addEventListener('DOMContentLoaded', function() {

    const form = document.querySelector('#post-form');
    const path = window.location.pathname;
    const parts = path.split('/').filter(part => part.length > 0);

    if (parts[0] === 'profile' && parts [1]) {
      const username = parts[1];
      console.log("loading:", username);
      load_profile(username);
    } else {
      load_posts('all-posts');
    }

    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            create_post(form);
        })
    }
  });

function create_post(form) {

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
    document.querySelector('#post-body').value = '';
    load_posts('all-posts')
  });
}
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

function load_posts(view, page = 1) {
  // div not a button
    const container = document.querySelector('#view-content');
    container.innerHTML = `<h3>${view.replace('-', ' ').toUpperCase()}</h3>`;
    // container.innerHTML = '';
    // const formView = document.querySelector('#new-post-view');  
    if (view === 'all-posts') {
      fetch(`/all_posts/?page=${page}`)
      .then(response => response.json())

      .then(data => {
        console.log(data);

        data.posts.forEach(post => {  
          likeButton = `
                      <button id="like-btn" class="btn btn-sm mt-2">
                      ♥️
                      </button>
                  `;

          const postDiv = document.createElement('div');
          postDiv.className = "card my-2 p-3 shadow-sm";

          postDiv.innerHTML = `
          <div class="d-flex justify-content-between">
          <a href="javascript:void(0)" 
            onclick="load_profile('${post.user}')" 
            class="font-weight-bold text-decoration-none" 
            style="color: #007bff; cursor: pointer;">
            @${post.user}
          </a>
          <small class="text-muted">${post.timestamp}</small>
          </div>
          <div class="mt-2">${post.body}</div>
          <div class="mt-2 text-primary">
          ${likeButton}${post.likes}
            </div>
          `;
          // like button
          container.append(postDiv);
          const btn = document.querySelector('#like-btn');
          if (btn) {
              btn.onclick = () => {
                console.log("liked");
                like_post(post.user);
              }
        };
        })

        // page buttons
        const nav = document.createElement('div');
        nav.className = "pagination mt-4";

        if (data.has_previous) {
          const prevBtn = document.createElement('button');
          prevBtn.innerText = "Previous";
          prevBtn.className = "btn btn-outline-primary ml-2";
          prevBtn.onclick = () => load_posts(view, data.current_page - 1);
          nav.append(prevBtn);
        }
        
        if (data.has_next) {
          const nextBtn = document.createElement('button');
          nextBtn.innerText = "Next";
          nextBtn.className = "btn btn-outline-primary ml-2";
          nextBtn.onclick = () => load_posts(view, data.current_page - 1);
          nav.append(nextBtn);
        }
        container.append(nav);

      })
      .catch(error => console.error('Error:', error));
    }
}


function load_profile(username) {
  // div not a button
    const container = document.querySelector('#view-content');
    container.innerHTML = '';
    
    fetch(`/profile_data/${username}`)
      .then(response => {
        if (!response.ok) {
                throw new Error(`Error en el servidor: ${response.status}`);
            }
            return response.json();
          })
      .then(data => {
        const header = document.createElement('div');
        header.className = "profile-header p-4 border-bottom";

        let followButton = '';
              if (!data.is_self) {
                  followButton = `
                      <button id="follow-btn" class="btn ${data.is_following ? 'btn-outline-danger' : 'btn-primary'} btn-sm mt-2">
                          ${data.is_following ? 'Unfollow' : 'Follow'}
                      </button>
                  `;
              }

            header.innerHTML = `
                  <h2>${data.username}'s profile</h2>
                  <div class="d-flex justify-content-between">
                  <div class="mr-4"><strong>@${data.following}</strong> Following</div>
                  <div class="ml-3">
                  <strong id="followers-count">${data.followers}</strong> Followers</div>
                </div>
                ${followButton}
              `;
              container.append(header);
              const btn = document.querySelector('#follow-btn');
              if (btn) {
                  btn.onclick = () => {
                    console.log("followed");
                    toggle_follow(data.username);
                  }
              };

              // Posts
              data.posts.forEach(post => {
                const postDiv = document.createElement('div');
                postDiv.className = "card my-2 p-3";
                postDiv.innerHTML = `
                <p>${post.body}</p>
                <small class="text-muted">${post.timestamp} | ♥️ ${post.likes}</small>
                `;
                container.append(postDiv);
              });
            })
            .catch(error => {
              console.error('Error detallado:', error);
              container.innerHTML = '<p>No se pudo cargar el perfil.</p>';
          });
}

function toggle_follow(username) {
    const csrftoken = getCookie('csrftoken'); 

    fetch(`/toggle_follow/${username}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({
          username: username
        })
    })
    
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => { throw new Error(text)});
      }
      return response.json();
    })

    .then(result => {
      console.log("toggle")
      const btn = document.querySelector('#follow-btn');
      const followersCount = document.querySelector('#followers-count');
      
        if (btn && result.action) {
            // Actualizar el botón
            if (result.action === "followed") {
                btn.innerText = "Unfollow";
                btn.className = "btn btn-outline-danger btn-sm mt-2";
            } else {
                btn.innerText = "Follow";
                btn.className = "btn btn-primary btn-sm mt-2";
            }

            if (followersCount && result.count !== undefined) {
              followersCount.innerText = result.count;
            }

        }
    })
    .catch(error => console.error("Error en el toggle:", error));
}


function like_post(post) {
  const csrftoken = getCookie('csrftoken'); 

  fetch(`/like_post/%{post}`, {
    method: 'POST',
    headers: {
          'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
  //   body: JSON.stringify({
  //   post: post
  // })
  })
  .then(response => response.json())
  .then (data => {
    const btn = document.querySelector('#likes-btn');
    const likesCount = document.querySelector('#likes-count');
    
    if (data.action === "liked") {
      icon.classList.add('text-danger');
    } else {
      icon.classList.remove('text-danger');
    }
    couuntSpan.innert = data.likesCount;
  });
}
  

