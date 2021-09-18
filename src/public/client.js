

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
    let { rovers, apod, activeRover, activeRoverPhotos } = state

    if (rovers.length === 0) {
        getRovers(store);
    }

    console.log(state);

    return `
        <header>
            <h1>THE MARTIANS</h1>
            <p>a list of current and former NASA Mars rovers</p>
        </header>
        <main class="rendered-main">
            ${Greeting(store.user.name)}
            <div class="panels">
                <section class="control-panel">
                    <ul class="rover-list">
                        <li class="rover-item" onclick="setActiveRover(false)">Apod</li>
                        ${createRoverList(rovers)}
                    </ul>
                </section>
                <section class="info-panel">
                    <h3>Selection: ${activeRover ? activeRover.name : 'APOD!'}</h3>
                    ${renderStats(activeRover)}
                    <br>
                    ${activeRover ? renderPhotos(activeRoverPhotos) : ImageOfTheDay(apod)}
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

// Pure function that renders conditional information -- THIS IS JUST AN EXAMPLE, you can delete it.
const Greeting = (name) => {
    if (name) {
        return `
            <h2>select a rover or </h2>
        `
    }

    return `
        <h1>Hello!</h1>
    `
}

// Example of a pure function that renders infomation requested from the backend
const ImageOfTheDay = (apod) => {

    // If image does not already exist, or it is not from today -- request it again
    const today = new Date()
    const photodate = new Date(apod.date)
    // console.log(photodate.getDate(), today.getDate());

    // console.log(photodate.getDate() === today.getDate());
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
            <img src="${apod.image.url}" height="350px" width="100%" />
            <p>${apod.image.explanation}</p>
        `)
    }
}

const renderStats = (activeRover) => {
    if (activeRover) {
        return `
            <p>Launch Date: ${activeRover?.launch_date}</p>
            <p>Landing Date: ${activeRover?.landing_date}</p>
            <p>Status: ${activeRover?.status}</p>
        `
    } else {
        return `<p>APOD pic of the day!</p>`;
    }
}

const renderPhotos = (photos) => {
    let photoList = ``;

    photos?.photos?.map((photo) => {
        photoList += `<img src="${photo.img_src}" height="350px" width="100%" />`
    })

    return photoList;
}

const createRoverList = (rovers) => {
    let roverList = ``;

    rovers?.rovers?.map((rover) => {
        roverList += `<li class="rover-item rover-item--non-apod" onclick="setActiveRover('${rover.name}')">${rover.name}</li>`;
    })

    return roverList;
}

const setActiveRover = (clickedRover) => {

    if (clickedRover !== false) {
        const matchedName = store?.rovers?.rovers?.filter(rover => {
            return rover.name === clickedRover;
        })
        

        const activeRover = matchedName[0];

        getRoverPhotos(activeRover.name.toLowerCase(), activeRover.max_date)
    
        updateStore(store, {activeRover})
    } else {
        const activeRover = clickedRover;

        updateStore(store, {activeRover})
    }
}

// ------------------------------------------------------  API CALLS

// Example API call
const getImageOfTheDay = (state) => {
    let { apod } = state

    fetch(`http://localhost:3000/apod`)
        .then(res => res.json())
        .then(apod => updateStore(store, { apod }))

    // return data
}

const getRovers = (state) => {
    let { rovers } = state

    fetch(`http://localhost:3000/rovers`)
        .then(res => res.json())
        .then(rovers => updateStore(store, {rovers}))

    // return data
}

/**
 * High order function to get rover photos
 */
 const getRoverPhotos = (roverName, maxDate) => {
    fetch(`http://localhost:3000/rovers/${roverName}?max_date=${maxDate}`)
      .then(res => res.json())
      .then(activeRoverPhotos => updateStore(store, {activeRoverPhotos}))
  }