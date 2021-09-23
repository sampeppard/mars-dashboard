

let store = {
    user: Immutable.Map({ name: "Student" }),
    apod: '',
    rovers: [],
}

// add our markup to the page
const root = document.getElementById('root')

const updateStore = (store, newState) => {
    store = Object.assign(store, newState)
    render(root, store)
}

const render = async (root, state) => {
    root.innerHTML = App(state)
}


// create content
const App = (state) => {
    let { rovers, apod, selectedRover, recentRoverPhotos } = state

    let mappedRovers;

    if (rovers.length === 0) {
        getRovers(mapRoverData);
    } else {
        mappedRovers = rovers?.toJS();
    }

    return `
        <header>
            <h1>THE MARTIANS</h1>
            <p>a list of current and former NASA Mars rovers</p>
        </header>
        <main class="rendered-main">
            <h2>Select a rover or APOD!</h2>
            <div class="panels">
                <section class="control-panel">
                    <ul class="rover-list">
                        ${renderApodListItem()}
                        ${createRoverList(mappedRovers)}
                    </ul>
                </section>
                <section class="info-panel">
                    <h3>Selection: ${selectedRover ? selectedRover.name : 'APOD!'}</h3>
                    ${renderStats(selectedRover)}
                    <br>
                    <div class="photo-wrapper">
                        ${selectedRover ? renderRecentRoverPhotos(recentRoverPhotos, mapPhotoData) : ImageOfTheDay(apod)}
                    </div>
                </section>
            </div>
        </main>
        <footer></footer>
    `
}

// listening for load event because page should load before any JS is called
window.addEventListener('load', () => {
    render(root, store)
})

// ------------------------------------------------------  COMPONENTS

// Example of a pure function that renders infomation requested from the backend
const ImageOfTheDay = (apod) => {

    // If image does not already exist, or it is not from today -- request it again
    const today = new Date()
    const photodate = new Date(apod.date)

    if (!apod || apod.date === today.getDate() ) {
        getImageOfTheDay(store)
    }

    // check if the photo of the day is actually type video!
    if (apod.media_type === "video") {
        return (`
            <p>See today's featured video <a href="${apod.url}">here</a></p>
            <p>${apod.title}</p>
            <p>${apod.explanation}</p>
        `)
    } else {
        return (`
            <img src="${apod?.image?.url}" width="100%" />
            <br>
            <p>${apod?.image?.explanation}</p>
        `)
    }
}

// Higher order function that returns a switch case function for rover stats
const renderStat = (statType) => {
    return (selectedRover) => {
        switch (statType) {
            case 'launch-date':
                return `<p>Launch Date: ${selectedRover?.launch_date}</p>`
            case 'landing-date':
                return `<p>Landing Date: ${selectedRover?.landing_date}</p>`
            case 'status':
                return `<p>Status: ${selectedRover?.status}</p>`
        }
    }
}

const renderLaunchDate = renderStat('launch-date');
const renderLandingDate = renderStat('landing-date');
const renderStatus = renderStat('status');

const renderStats = (selectedRover) => {
    if (selectedRover) {
        return `
            ${renderLaunchDate(selectedRover)}
            ${renderLandingDate(selectedRover)}
            ${renderStatus(selectedRover)}
        `
    } else {
        return `<p>APOD pic of the day!</p>`;
    }
}

const createPhoto = (photo) => {
    return `
        <div class="single-photo-wrapper">
            <p>This photo was taken on ${photo.earth_date}</p>
            <img src="${photo.img_src}" class="rover-photo" style="border-radius: 10px" />
        </div>
    `
}

// custom higher order function
const mapPhotoData = (photos, callback) => {
    
    let photoList = ``;

    photos?.photos?.map((photo) => {
        photoList += callback(photo)
    });

    return photoList;
}

// custom higher order function
const renderRecentRoverPhotos = (photos, callback) => {

    const recentPhotos = callback(photos, createPhoto);

    return recentPhotos;
}

const renderListItem = (itemType) => {
    return (rover) => {
        if (itemType === 'rover') {
            return `<li class="rover-item rover-item--non-apod" onclick="setActiveRover('${rover.name}')">${rover.name}</li>`
        } else {
            return `<li class="rover-item" onclick="setActiveRover(false)">Apod</li>`
        }
    }
}

const renderRoverListItem = renderListItem('rover');
const renderApodListItem = renderListItem('apod');

const createRoverList = (rovers) => {
    let roverList = ``;

    rovers?.map((rover) => {
        roverList += renderRoverListItem(rover);
    })

    return roverList;
}

const setActiveRover = (clickedRover) => {
    const mappedRovers = store?.rovers.toJS()

    if (clickedRover !== false) {
        // standard higher order function
        const matchedName = mappedRovers.filter(rover => {
            return rover.name === clickedRover;
        })

        const selectedRover = matchedName[0];

        getRoverPhotos(selectedRover?.name.toLowerCase(), selectedRover.max_date)
    
        updateStore(store, {selectedRover})
    } else {
        const selectedRover = clickedRover;

        updateStore(store, {selectedRover})
    }
}

const mapRoverData = (data) => {
    const mappedRovers = {
        rovers: Immutable.List(data.rovers)
    }

    updateStore(store, mappedRovers)
}

// ------------------------------------------------------  API CALLS

// GET IMAGE OF THE DAY
const getImageOfTheDay = (state) => {
    let { apod } = state

    fetch(`http://localhost:3000/apod`)
        .then(res => res.json())
        .then(apod => updateStore(store, { apod }))
}

// Higher-order function to get rovers
const getRovers = (callback) => {
    
    fetch(`http://localhost:3000/rovers`)
        .then(res => res.json())
        .then(data => {
            return callback(data);
        })
}

// get rover photos
const getRoverPhotos = (roverName, maxDate) => {
fetch(`http://localhost:3000/rovers/${roverName}?max_date=${maxDate}`)
    .then(res => res.json())
    .then(recentRoverPhotos => updateStore(store, {recentRoverPhotos}))
}