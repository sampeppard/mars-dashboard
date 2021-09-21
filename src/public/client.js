

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

    let mappedRovers;

    if (rovers.length === 0) {
        getRovers(store);
    } else {
        mappedRovers = rovers.toJS();
    }

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
                        ${createRoverList(mappedRovers)}
                    </ul>
                </section>
                <section class="info-panel">
                    <h3>Selection: ${activeRover ? activeRover.name : 'APOD!'}</h3>
                    ${renderStats(activeRover)}
                    <br>
                    <div class="photo-wrapper">
                        ${activeRover ? renderPhotos(activeRoverPhotos) : ImageOfTheDay(apod)}
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
        console.log(photo);
        photoList += `
            <div class="single-photo-wrapper">
                <p>This photo was taken on ${photo.earth_date}</p>
                <img src="${photo.img_src}" class="rover-photo" style="border-radius: 10px" />
            </div>
        `
    })

    return photoList;
}

const createRoverList = (rovers) => {
    let roverList = ``;

    rovers?.map((rover) => {
        roverList += `<li class="rover-item rover-item--non-apod" onclick="setActiveRover('${rover.name}')">${rover.name}</li>`;
    })

    return roverList;
}

const setActiveRover = (clickedRover) => {
    const mappedRovers = store?.rovers.toJS()

    if (clickedRover !== false) {
        const matchedName = mappedRovers.filter(rover => {
            return rover.name === clickedRover;
        })

        const activeRover = matchedName[0];

        getRoverPhotos(activeRover?.name.toLowerCase(), activeRover.max_date)
    
        updateStore(store, {activeRover})
    } else {
        const activeRover = clickedRover;

        updateStore(store, {activeRover})
    }
}

// ------------------------------------------------------  API CALLS

// GET IMAGE OF THE DAY
const getImageOfTheDay = (state) => {
    let { apod } = state

    fetch(`http://localhost:3000/apod`)
        .then(res => res.json())
        .then(apod => updateStore(store, { apod }))
}

const getRovers = () => {
    fetch(`http://localhost:3000/rovers`)
        .then(res => res.json())
        .then(data => {
            const mappedRovers = {
                rovers: Immutable.List(data.rovers)
            }

            updateStore(store, mappedRovers)
        })
}

// get rover photos
 const getRoverPhotos = (roverName, maxDate) => {
    fetch(`http://localhost:3000/rovers/${roverName}?max_date=${maxDate}`)
      .then(res => res.json())
      .then(activeRoverPhotos => updateStore(store, {activeRoverPhotos}))
  }