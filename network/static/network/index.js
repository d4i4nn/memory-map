document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");

    const postForm = document.querySelector('#post-form');

    if (postForm) {
        postForm.addEventListener('submit', function(event) {
            const body = document.querySelector('#post-body').value;
            console.log("hey", body);
            alert('Post posted');
            document.querySelector('#post-body').value = '';
        })
    }
  })
