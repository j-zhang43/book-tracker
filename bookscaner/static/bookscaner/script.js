const csrf_token = document.querySelector("#csrf_token").firstElementChild.value

if (document.querySelector("#page").innerHTML == "search") {

    document.querySelector("#search-submit").addEventListener("click", ()=>{
        document.querySelector("#search-book-list").innerHTML = "";
        document.querySelector("#search-picture").value = "";
        getBooks(document.querySelector("#search-title").value)
    });

    document.addEventListener("keypress", event=>{
        if (event.key == "Enter") {
            document.querySelector("#search-book-list").innerHTML = "";
            document.querySelector("#search-picture").value = "";
            getBooks(document.querySelector("#search-title").value)
        }
    });

    const imageInput = document.querySelector("#search-picture")
    imageInput.addEventListener("change", (event)=>{
        document.querySelector("#search-book-list").innerHTML = "";

        if (imageInput.files.length > 0) {
            const image = event.target.files[0];
            if (image) {
                const imageData = new FormData();
                imageData.append('image',image);

                fetch('/search', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrf_token
                    },
                    body: imageData
                })
                .then(response => response.json())
                .then(orc_result => {
                    console.log(orc_result)
                    getBooks(orc_result.ocr_result)
                });
            }
        }
    });
}

if (document.querySelector("#page").innerHTML == "book") {
    library_btn = document.querySelector("#book-library-btn");

    library_btn.onclick = () => {
        if (library_btn.innerHTML == "Add to Library") {
            library_btn.innerHTML = "Remove from Libraray";

            fetch(window.location.pathname, {
                method: "POST",
                headers: {
                    'X-CSRFToken': csrf_token
                },
                body: JSON.stringify({
                    "library": "add_library"
                })
            })
        } else {
            library_btn.innerHTML = "Add to Library";

            fetch(window.location.pathname, {
                method: "DELETE",
                headers: {
                    'X-CSRFToken': csrf_token
                },
                body: JSON.stringify({
                    "library": "delete_library"
                })
            })
        }
    
    }

    const rating = document.querySelector("#book-rating").innerHTML;
    changeStars("book-stars", rating)

}

if (document.querySelector("#page").innerHTML == "library") {

    let real_ratings = new Map()

    document.querySelectorAll(".library-rating").forEach(element => {
        id = element.closest(".stars").id;
        real_ratings.set(id ,parseFloat(element.innerHTML))
        changeStars(id, real_ratings.get(id))
    })

    let current_rating;
    let current_id;

    document.addEventListener("mousemove", event => {
        const element = event.target.closest(".stars");

        if (element) {
            current_id = element.id;
            const rect = element.getBoundingClientRect();
            const percent = (event.clientX - rect.left) / rect.width;
            current_rating = (percent+.1)*5
            changeStars(current_id,current_rating);
        } else if (current_id != null) {
            if (real_ratings.get(current_id)) {
                changeStars(current_id, real_ratings.get(current_id));
            } else {
                changeStars(current_id, 0);
            }
        }
    })
    
    document.addEventListener("click", event => {
        const element = event.target.closest(".stars");

        if (element) {
            event.preventDefault();
            event.stopPropagation();
            real_ratings.set(current_id, current_rating)
            
            fetch("/library", {
                "method": "POST",
                "headers": {
                    'X-CSRFToken': csrf_token
                },
                "body": JSON.stringify({
                    "book_id": current_id,
                    "rating": real_ratings.get(current_id)
                })
            })

            changeStars(current_id, real_ratings.get(current_id))      
        } 
    })

    document.querySelectorAll(".form-select").forEach(forms=>{
        forms.onclick = event=> {
            event.preventDefault();
            event.stopPropagation();            
        }
        forms.onchange = event=>{
            console.log(event.target.value);
            fetch("/library", {
                "method": "PUT",
                "headers": {
                    'X-CSRFToken': csrf_token
                },
                "body": JSON.stringify({
                    "book_id": event.target.id,
                    "status": event.target.value
                })
            })
        }
    })

    document.querySelectorAll(".library-description").forEach(description =>{
        if (description.innerHTML.length >= window.innerHeight/2) {
            description.innerHTML = description.innerHTML.slice(0,window.innerHeight/2) + "...";
        }
    })
}

if (document.querySelector("#page").innerHTML == "profile") {
    document.querySelectorAll(".profile-status").forEach(num=>{
        if(num.innerHTML.length<3){
            for(let i = 0; i<3-num.innerHTML.length; i++){
                num.innerHTML = "0" + num.innerHTML;
            }
        }
    });

    const ratings_chart = document.querySelector("#profile-ratings-chart");
    let ratings = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
    let counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    document.querySelectorAll(".profile-ratings").forEach(rating=>{
        let count = document.getElementById(`profile-rating-${rating.innerHTML}`);        
        counts[ratings.indexOf(parseFloat(rating.innerHTML))] = parseInt(count.innerHTML);
    })

    new Chart(ratings_chart, {
        type: "bar",
        data: {
            labels: ratings,
            datasets:[{
                data: counts
            }],
            borderColor: "rbg(0,0,0)"
        },
        options: {
            plugins: {
                legend: {
                    display: false
                }
            },
            borderRadius: 10,
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: false
                }
            }
        }
    });
}

function changeStars(parentStarContainerId, rating) {
    const whole = Math.floor(rating);
    const decimal = rating * 10 % 10;

    for (let i = 0; i<5; i++) {
        const star = document.querySelector(`#${parentStarContainerId}`).children[i];
        star.className = "bi-star";
    }

    for (let i = 0; i<whole; i++) {
        const star = document.querySelector(`#${parentStarContainerId}`).children[i];
        star.className = "bi-star-fill";
    }

    if (decimal >= 5) {
        const half_star = document.querySelector(`#${parentStarContainerId}`).children[whole];
        half_star.className = "bi-star-half";
    }
}

function getBooks(title) {
    book_title = title.replace(" ", "+");

    if (document.querySelector("#search-file-div")) {
        if (book_title.length > 0 ) {
            document.querySelector("#search-file-div").style.display = "none";
        } else {
            document.querySelector("#search-file-div").style.display = "block";
        }
    }

    fetch(`https://www.googleapis.com/books/v1/volumes?q=${book_title}`)
    .then(response => response.json())
    .then(books => {
        if (books.totalItems == 0) {
            addEmptySearch();
        } else {
            for (book of books.items) {
                console.log(book);
                addBook(book.volumeInfo, book.id);
            }
        }
    });
}

const MAX_CHAR_DESC = window.innerWidth/2;
function addBook(book_info, book_id) {
    const a = document.createElement("a");
    a.href = `/book/${book_id}`;

    const li = document.createElement("li");
    li.classList.add("list-group-item");
    
    const div = document.createElement("div");
    div.classList.add("m-4");

    const book_img = document.createElement("img");
    if (book_info.imageLinks && book_info.imageLinks.smallThumbnail) {
        book_img.src = book_info.imageLinks.smallThumbnail;
    }
    book_img.classList.add("ms-4");

    const book_title = document.createElement("h5");
    book_title.innerHTML = book_info.title;

    const book_author = document.createElement("div");
    book_author.innerHTML = book_info.authors ? book_info.authors : "" ;
    book_author.innerHTML = book_author.innerHTML.replace(",", ", ");

    const book_description = document.createElement("div");
    book_description.classList.add("text-secondary", "my-3");
    book_description.innerHTML = book_info.description ? book_info.description : "";

    if (book_info.description) {
        if (book_info.description.length>MAX_CHAR_DESC) {
            book_description.innerHTML = book_info.description.slice(0,MAX_CHAR_DESC) + "...";
        } else {
            book_description.innerHTML = book_info.description;
        }
    } else {    
        book_description.innerHTML = "";
    }

    const book_pusblished_date = document.createElement("div");
    book_pusblished_date.classList.add("text-secondary");
    book_pusblished_date.innerHTML = book_info.publishedDate ? book_info.publishedDate : "" ;

    document.querySelector("#search-book-list").append(li);
    div.append(book_title,book_author,book_description,book_pusblished_date);
    a.append(book_img,div)
    li.append(a);
}

function addEmptySearch(){
    const h4 = document.createElement("h4")
    h4.innerHTML = "No book found";
    h4.classList.add("text-center");
    document.querySelector("#search-book-list").append(h4);
}