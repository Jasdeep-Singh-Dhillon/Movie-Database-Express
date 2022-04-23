$('#addComment').on('click', addComment);

function addComment(){

  let username = $('#username').val();
  let movieId = $('#movieId').val();

  $('#newComment').html(`
    <h5>Adding Comment</h5>
    <form method='post' action='/comment/new'>
      <div class='d-flex newCommentHead'>
        <div>
          Worth Watching:
          <input type='radio' name='worthWatching' value='Yes' class='form-check-input' id='worthYes'> 
          <label for='worthYes' class='form-check-label'>Yes</label>
          <input type='radio' name='worthWatching' value='No' class='form-check-input' id='worthNo'>
          <label for='worthNo' class='form-check-label'>No</label>
        </div>
        <div>
          Rating:
          <select name='rating'>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10</option>
          </select> 
        </div>
      </div>
      <textarea name='comment'></textarea>
      <input type='hidden' name='username' value='${username}'>
      <input type='hidden' name='movieId' value='${movieId}'>
      <button class='btn btn-primary'>Comment</button>
    </form>`);
}