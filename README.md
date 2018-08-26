
# MockSSE

[![pipeline status](https://gitlab.com/binarymist/mocksse/badges/master/pipeline.svg)](https://gitlab.com/binarymist/mocksse/commits/master)

This project is a port/rewrite of [MockEvent](https://github.com/eloyz/mockevent) (which targets the browser). Instead, this project was designed for mocking EventSource (specifically the npm package [eventsource](https://github.com/EventSource/eventsource)) /Server Sent Events (SSE) where both your server side and client side are written for the NodeJS platform.

MockSSE simulates [SSE](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events).

Useful if you want to:

* Build the client side without having the server side available to you
* Or simply unit testing -> C/I, rather than integration tests

This project has no dependencies other than native modules.

* [Installation](#install)
* [Usage](#usage)
* [Contribution](#contribution)
* [Acknowledgements](#acknowledgements)
* [License](#license)

## Install

`npm install mocksee --save-dev`

## Usage

All examples include:

* How to instantiate a [`MockEvent`](https://gitlab.com/binarymist/mocksse/blob/494675303c32cc8f5c87e20f8482e8c10bd76742/src/mocksse.js#L234) which streams the data
* How to instantiate an [`EventSource`](https://gitlab.com/binarymist/mocksse/blob/494675303c32cc8f5c87e20f8482e8c10bd76742/src/mocksse.js#L137) which consumes the data
* Adding at least one event listener

As well as the following examples:

* The [tests](https://gitlab.com/binarymist/mocksse/blob/master/test/mocksse.js) demonstrate how to use the project along with the feature set
* The project that uses `mocksse` for testing the client side of its server sent events (SSE) can be seen at the [purpleteam](https://gitlab.com/purpleteam-labs/purpleteam/tree/master) repository

### Example 0

Getting started with the least amount of work (based on test [`should handle an event to relative url`](https://gitlab.com/binarymist/mocksse/blob/494675303c32cc8f5c87e20f8482e8c10bd76742/test/mocksse.js#L19)).

```javascript
const { MockEvent, EventSource } = require('mocksse');

// Instantiate a MockEvent.
new MockEvent({
  url: '/your-relative-or-absolute-url',
  responses: [
    { type: 'a message event', data: 'a short message' }
  ]
});

// Instantiate an EventSource.
const evtSource = new EventSource('/your-relative-or-absolute-url');

// Listen for a "a message event" event and handle appropriately.
evtSource.addEventListener('a message event', (event) => {
  // event.type === 'a message event'
  // event.data === 'a short message'
});

```

### Example 1

Multiple event listeners (based on test [should handle an event with setInterval, and collection of full responses](https://gitlab.com/binarymist/mocksse/blob/494675303c32cc8f5c87e20f8482e8c10bd76742/test/mocksse.js#L81)).

```javascript
const { MockEvent, EventSource } = require('mocksse');

// Instantiate a MockEvent.
new MockEvent({
  url: 'http://noPlaceLikeHome:2000/your-route',
  setInterval: 10,
  responses: [
    { lastEventId: 'event Id One', type: 'progressEvent', data: { progress: 'Look mum, I am making great progress' } },
    { lastEventId: 'event Id Two', type: 'pctCompleteEvent', data: { pctComplete: 11 } },
    { lastEventId: 'event Id three', type: 'temperatureEvent', data: { temperature: 25 } }
  ]
});

// Instantiate an EventSource.
const evtSource = new EventSource('http://noPlaceLikeHome:2000/your-route');

// Listen for multiple events and handle appropriately.
evtSource.onopen = (event) => { // Optionally subscribing to the open event
  // You can see this event in mocksse.js.
  // event === { message: 'The opening message.', anotherCustomeProp: { prop: 'whatever' } }  
};
evtSource.addEventListener('progressEvent', (event) => {
  // event.type === 'progressEvent'
  // event.data === { progress: 'Look mum, I am making great progress' }
  // event.origin === 'http://noPlaceLikeHome:2000'
  // event.lastEventId === 'event Id One'
});
evtSource.addEventListener('pctCompleteEvent', (event) => {
  // event.type === 'pctCompleteEvent'
  // event.data === { pctComplete: 11 }
  // event.origin === 'http://noPlaceLikeHome:2000'
  // event.lastEventId === 'event Id Two'
});
evtSource.addEventListener('temperatureEvent', (event) => {
  // event.type === 'temperatureEvent'
  // event.data === { temperature: 25 }
  // event.origin === 'http://noPlaceLikeHome:2000'
  // event.lastEventId === 'event Id three'
});
```

* `url`: The relative or full URL for your Server Sent Event API.  This is the URL we will subscribe to via `EventSource`
* `setInterval`: Miliseconds to wait before sending the next event/response
* `responses`: A list of event/responses to send and the order in which to send them
  * `lastEventId` can be set and read
  * `type`: Server Sent Events can have a name that you directly subscribe to in case you want to handle that name differently. In the above example we require you to subscribe to 3 different names `progressEvent`, `pctCompleteEvent`, and `temperatureEvent`. A [working example](https://gitlab.com/purpleteam-labs/purpleteam/blob/94ed3203086173d5fd06920a25b785a57673279c/src/presenter/apiDecoratingAdapter.js#L101-L103) of this can be seen in the purpleteam project
  * `data`: The data you want to send

### Example 2

Dynamically make responses and then have them `stream`ed (based on test [response function should be called, which then sends event](https://gitlab.com/binarymist/mocksse/blob/9362050dfeae6620b85a3827c802374ae3b14dd6/test/mocksse.js#L190)).

```javascript
const { MockEvent, EventSource } = require('mocksse');

// Instantiate a MockEvent.
new MockEvent({
  url: 'http://noPlaceLikeHome:2000/your-route',
  setInterval: [100, 200],
  response: (mockEvent, evtSource) => {
    const data = [
      { lastEventId: 'event Id One', type: 'yourEvent', data: { yourProp: 'Wish I was done!' } },
      { lastEventId: 'event Id Two', type: 'yourEvent', data: { yourProp: 'Oh, wow, nearly done!' } }
    ];
    // In this case we have static data, but you can build that data
    // however you choose and then stream it when you're ready.
    mockEvent.stream(data);
  }
});

// Instantiate an EventSource.
const evtSource = new EventSource('http://noPlaceLikeHome:2000/your-route');

// Listen for a "yourEvent" event and handle appropriately.
evtSource.addEventListener('yourEvent', (event) => {
  // On first invocation: event === { origin: 'http://noPlaceLikeHome:2000, lastEventId: 'event Id One', type: 'yourEvent', data: { yourProp: 'Wish I was done!' } }
  // On second invocation: event === { origin: 'http://noPlaceLikeHome:2000, lastEventId: 'event Id Two', type: 'yourEvent', data: { yourProp: 'Oh, wow, nearly done!' } }
});

```

This uses the `response` attribute instead of the plural `responses` method.  Here you can build build a list of responses to send and then stream them when you're ready.

The `stream` method respects the `setInterval` property you specified. Also notice that `setInterval` can be set to an `int`, `float`, or `array` representing a min/max range of milliseconds.

Technically you can use any method and then call `handler.stream`. The benefit of using the `response` hook is that you get the `mockEvent` and `evtSource` object in case you need those values for anything.  Example 3 shows how you can benefit from these objects.

### Example 3

Dynamically make responses and then `stream` them yourself within your `response` function (based on test [response function should be called, which then streams events itself](https://gitlab.com/binarymist/mocksse/blob/58439a92aacde9767d4f07a44fa59b7d657d52b8/test/mocksse.js#L219)).

```javascript
const { MockEvent, EventSource } = require('mocksse');

// Instantiate a MockEvent.
new MockEvent({
  url: 'http://noPlaceLikeHome:2000/your-route',
  setInterval: [100, 200],
  response: (mockEvent, evtSource) => {
    const data = [
      { lastEventId: 'event Id One', type: 'yourEvent', data: { yourProp: 'Wish I was done!' } },
      { lastEventId: 'event Id Two', type: 'yourEvent', data: { yourProp: 'Oh, wow, nearly done!' } }
    ];
    // In this case we have static data, but you can build that data
    // however you choose and then stream it when you're ready.
    const intervalId = setInterval(() => {
      const responseData = data.shift() || clearInterval(intervalId);
      if (responseData) mockEvent.dispatchEvent(responseData);
    }, mockEvent.setInterval);
  }
});

// Instantiate an EventSource.
const evtSource = new EventSource('http://noPlaceLikeHome:2000/your-route');

// Listen for a "yourEvent" event and handle appropriately.
evtSource.addEventListener('yourEvent', (event) => {
  // On first invocation: event === { origin: 'http://noPlaceLikeHome:2000, lastEventId: 'event Id One', type: 'yourEvent', data: { yourProp: 'Wish I was done!' } }
  // On second invocation: event === { origin: 'http://noPlaceLikeHome:2000, lastEventId: 'event Id Two', type: 'yourEvent', data: { yourProp: 'Oh, wow, nearly done!' } }
});
```

Here we write our own `stream` method that loops through data and sends. Still respecting the `setInterval` attribute and leveraging the internal `dispatchEvent` method of the `mockEvent`.  This is not recommended, it's just used as an example to show the amount of access you have to all attributes.  Using the `dispatchEvent` method directly overwrites the `stream` attribute and will not respect other queues that maybe set by you later.

### Example 4

Closing the EventSource then subscribing to an event will invoke the error handler if you have subscribed to `onerror` (based on test [`closing the EventSource then subscribing to an event should invoke the error handler`](https://gitlab.com/binarymist/mocksse/blob/494675303c32cc8f5c87e20f8482e8c10bd76742/test/mocksse.js#L265)).

```javascript
const { MockEvent, EventSource } = require('mocksse');

// Instantiate a MockEvent.
const mockEvent = new MockEvent({
  url: 'http://noPlaceLikeHome:2000/your-route',
  verbose: true, // Feel free to turn verbosity on.
  responses: [
    { type: 'a message event', data: 'a short message' }
  ]
});

// Instantiate an EventSource.
const evtSource = new EventSource('http://noPlaceLikeHome:2000/your-route');

evtSource.close();

// Listen for a "a message event" event and handle appropriately.
evtSource.addEventListener('a message event', (event) => {
  // The event handler will not be invoked on a closed EventSource.
});

evtSource.onerror = (error) => {
  // Expect to see the following message
  // error.message === '`EventSource` instance closed while sending.'
};
```

## Contribution

Please open an [issue](https://gitlab.com/binarymist/mocksse/issues) to discus the proposed change before submitting a [merge request](https://gitlab.com/binarymist/mocksse/merge_requests).


## Acknowledgements

This project is a port/rewrite of [MockEvent](https://github.com/eloyz/mockevent), which targets the browser.  
Inspiration was also taken from [eventsourcemock](https://github.com/gcedo/eventsourcemock), which is also browser focussed and very minimal.

## License

Copyright [Kim Carter](https://gitlab.com/binarymist) and other contributors, Licensed under [MIT](./LICENSE).
