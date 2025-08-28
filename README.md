# Overview

A simple bookscaner and tracker allow you to search for books, add books to your library, and tracking the status of books. You can login and register for an account and search for book by going to the search page in the navigation. After you login, you can logout by clicking logout.

You can search books in the search bar where by clicking the search icon or the Enter key. Another option presented to you taking a picture of your book which will also show results of the book. In the search results, you can click on a book to view more information about the book as well as view its overall rating, the number of people that have rated that book, and add/remove books from your library.

 On the home page, there books that are organized in sections by popularity, recently viewed, and currently reading. On the profile page, there is a chart containing information about the how many books are rated in that rating. Futhermore, there is a section that shows the count of the statuses of books (Reading, On Hold, Dropped, Finished, and Waitlist).

# Distinctive and Complexity

I believe that this project satsifies the distinctiveness and complexity requirement by using the follow:

- Google Books API to obtain book information
- Tesseract OCR to reverse image search for a book
- Charts.js to display data about the user

# Files Information

The project is separated into static and template files to manage the interface and main functionality effectively. In the [static/bookscaner](bookscaner\static\bookscaner) directory, the [styles.scss](bookscaner\static\bookscaner\styles.scss) contains all the styling for each template, with a responsive and consistent layout. The [script.js](bookscaner\static\bookscaner\script.js) manages most of the main interactive functionalities. These include detecting the search inputs, uploading files for scanning through OCR, getting book information from the Google Books API, and showing that information. It also manages the addition of books to a user's collection, dynamically monitors book ratings and status, and shows a chart graph using Chart.js from user rating data.

HTML templates in the templates/bookscaner directory define the user-visible views. [book.html](bookscaner/templates\bookscaner\book.html) shows information about detailed books and offers links to add books to a user library. [index.html](bookscaner\templates\bookscaner\index.html) shows books by popularity, recently read, and current reads. [layout.html](bookscaner\templates\bookscaner\layout.html) is the overall structure for consistent structure per page. [library.html](bookscaner\templates\bookscaner\library.html) displays the user's library of books and allows for rating and marking as read. The [login.html](bookscaner\templates\bookscaner\login.html) and [register.html](bookscaner\templates\bookscaner\register.html) templates support user authentication, while profile.html has a graphical summary of the user's book ratings and read status. [search.html](bookscaner\templates\bookscaner\search.html) has an enhanced interface to search books by text or image and aggregates results from the Google Books API.

Besides the front end, the backend has admin.py for Django admin configuration and [views.py](bookscaner\views.py), tasked with rendering templates, model interaction, and frontend fetch request handling. The [models.py](bookscaner\models.py) holds the data structure, i.e., three principal models: Books, Rating, and BookStatus, which collectively facilitate the core functionality of the app.

# Installation and Running

- Install Python and create virtual environment (venv)
- Install the necessary python packages in your venv:
    - django
    - pillow
    - pytesseract
- Install [Google Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
- Use Google OAuth for Google Books API
- Run django server in your venv