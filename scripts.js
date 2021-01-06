const POST_AUTH = 'SharedAccessSignature sr=https%3A%2F%2Fccgrowth.servicebus.windows.net%2Fformsink%2Fmessages&sig=RFndMU%2FyHZrlchNBfHlIdulld4URAgUAQdAlqVLf1Bw%3D&se=1634259041&skn=send';
const TEST_URL = 'https://adobeioruntime.net/api/v1/web/helix-clients/ccgrowth/forms-handler@v1';
const COMMENT_THRESHOLD = 3;

const getDate = () => new Date().toISOString().replace(/[TZ]/g, ' ').split('.')[0].trim();

const getRating = form => form.dataset.rating || 0;

const getReviewData = (form) => {
    const { localStorage } = window;
    const { reviewLocation } = form.dataset;
    const reviewData = localStorage.getItem(reviewLocation);
    try {
        // This will return null if the local storage object is empty.
        return JSON.parse(reviewData);
    } catch (e) {
        // Catch in case someone set something weird in our local storage.
        return (null);
    }
};

const updateTotal = (statsEl, total) => {
    const totalEl = statsEl.querySelector('.hlx-ReviewStats-total');
    totalEl.innerHTML = total;
};

const setReviewData = (reviewLocation, value, form) => {
    const { localStorage } = window;
    const { total } = form.dataset;
    const totalRev = parseFloat(total) + 1;
    const reviewData = { currentRating: value, total: totalRev };
    localStorage.setItem(reviewLocation, JSON.stringify(reviewData));
    const statsEl = form.nextElementSibling;
    updateTotal(statsEl, totalRev);
};

const getComments = (form) => {
    const textarea = form.querySelector('textarea');
    return textarea.value;
};

const sendRequest = (value, form) => {
    const { sheet, reviewLocation } = form.dataset;
    const data = [
        { name: 'Timestamp', value: getDate() },
        { name: 'Rating', value },
        { name: 'Locale', value: document.documentElement.lang },
    ];

    // If they are not a happy customer, get their feedback.
    if (value <= COMMENT_THRESHOLD) {
        data.push({ name: 'Comment', value: getComments(form) });
    }

    const body = { sheet, data };

    // The response can take a while,
    // set the UI before we know we're ok.
    // It's just burgers and fries here.
    form.setAttribute('data-rating', value);
    setReviewData(reviewLocation, value, form);

    fetch(TEST_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: POST_AUTH,
        },
        body: JSON.stringify(body),
    });
};

const showComments = (form, value) => {
    const clickEvent = (e) => {
        e.preventDefault();
        sendRequest(value, form);
        form.removeEventListener('click', clickEvent);
    };
    const commentFieldset = form.querySelector('.hlx-Review-commentFields');
    commentFieldset.classList.add('is-Visible');
    const submitEl = form.querySelector('.hlx-Review-commentFields input[type="submit"]');
    submitEl.addEventListener('click', clickEvent);
};

const setRadioUx = (radios, value = 0, wasClicked) => {
    radios.forEach((radio) => {
        // eslint-disable-next-line no-unused-expressions
        radio.value <= value ? radio.classList.add('is-Active') : radio.classList.remove('is-Active');
        if (wasClicked) {
            radio.classList.remove('is-Clicked');
        }
    });
};

const setTotalReviewUx = (statsEl, reviewData, form) => {
    const { reviewLocation } = form.dataset;
    try {
        const resPromise = fetch(`/${reviewLocation}.json`);
        resPromise.then((res) => {
            if (res.ok) {
                res.json().then((reviewRes) => {
                    const { average, total } = reviewRes.data[0];

                    // Compare the local storage count to our server count. Highest wins.
                    let localTotal = 0;
                    if (reviewData) {
                        localTotal = reviewData.total;
                    }
                    const totalReviews = localTotal > total ? localTotal : total;
                    form.setAttribute('data-total', totalReviews);

                    // Update the average
                    const averageEl = statsEl.querySelector('.hlx-ReviewStats-average');
                    averageEl.innerHTML = average;

                    // Update the total
                    updateTotal(statsEl, totalReviews);

                    // Show the totals
                    statsEl.classList.add('is-Visible');
                });
            }
        });
    } catch (e) {
        console.log('The review response was not proper JSON.');
    }
};

const radioClicked = (el, form, rateRadios) => {
    const { value } = el;
    if (value <= COMMENT_THRESHOLD) {
        form.setAttribute('data-rating', value);
        setRadioUx(rateRadios, value, true);
        showComments(form, value);
    } else {
        sendRequest(el.value, form);
    }
    el.classList.add('is-Clicked');
};

/**
 * When the form is hovered, detect if the hovered element was a rating.
 *
 * Yes, dear listener: you can do this in CSS. To get a flawless UX without
 * a ton of CSS is not worth it. This is overall less code.
 * @param {HTMLElement} el the element that was hovered
 * @param {NodeList} radios the radios to act on
 */
const formHovered = (el, radios) => {
    const { name, value } = el;
    if (name === 'rating') {
        setRadioUx(radios, value, false);
    }
};

const setupEvents = (form, rateRadios) => {
    // Setup hover and leave event
    // This is purely for UX.
    form.addEventListener('mouseover', (e) => {
        formHovered(e.target, rateRadios);
    });
    form.addEventListener('mouseleave', () => {
        // Reset the clicked rating on mouse out
        setRadioUx(rateRadios, getRating(form));
    });

    // Setup click event
    rateRadios.forEach((radio) => {
        radio.addEventListener('click', (e) => {
            radioClicked(e.target, form, rateRadios);
        });
    });
};

const setupReviews = (element) => {
    const reviewForms = element.querySelectorAll('.hlx-Review');
    reviewForms.forEach((form) => {
        const rateRadios = form.querySelectorAll('input[type="radio"]');
        const statsEl = form.nextElementSibling;
        const reviewData = getReviewData(form);

        if (!reviewData) {
            setupEvents(form, rateRadios);
        } else {
            form.setAttribute('data-rating', reviewData.currentRating);
            setRadioUx(rateRadios, reviewData.currentRating);
        }

        // Always set total review count
        setTotalReviewUx(statsEl, reviewData, form);
    });
};

/**
 * A utility to overcome some of the weirdness of MD + CSS class names.
 * TODO: remove when there's a proper HTML file
 */
const setupMarkdownJank = () => {
    const wrapper = document.querySelector('main > div');
    wrapper.classList.add('hlx-ReviewWrapper');
    const forms = document.querySelectorAll('form[data-sheet]');
    forms.forEach((form) => {
        form.classList.add('hlx-Review');
        form.querySelector('fieldset:first-of-type').classList.add('hlx-Review-ratingFields');
        form.querySelector('fieldset:last-of-type').classList.add('hlx-Review-commentFields');

        const pre = 'hlx-ReviewStats';

        const reviewStats = form.nextElementSibling;
        reviewStats.classList.add(pre);
        reviewStats.querySelector('span:nth-child(1)').classList.add(`${pre}-average`);
        reviewStats.querySelector('span:nth-child(2)').classList.add(`${pre}-separator`);
        reviewStats.querySelector('span:nth-child(3)').classList.add(`${pre}-outOf`);
        reviewStats.querySelector('span:nth-child(4)').classList.add(`${pre}-separator`);
        reviewStats.querySelector('span:nth-child(5)').classList.add(`${pre}-total`);
        reviewStats.querySelector('span:nth-child(6)').classList.add(`${pre}-vote`);
    });
};

setupMarkdownJank();
setupReviews(document);
