exports.lab = require('lab').script();

const { describe, it, before } = exports.lab;
const { expect, fail } = require('code');
const { MockEvent, EventSource } = require('../src//mocksse');

const pseudoRandId = () => Math.random().toString().substring(2);

const calledOnce = 1;


describe('Mock EventSource', () => {
  before((flags) => {
    // eslint-disable-next-line no-param-reassign
    flags.context.incrementCallCount = (eventType, handlerCallCounts) => {
      handlerCallCounts.find(cntr => Object.keys(cntr)[0] === eventType)[eventType] += 1; // eslint-disable-line no-param-reassign
    };
  });
  it(' - should handle an event to relative url', async (flags) => {
    const numberOfEvents = 1;
    const mockEvent = new MockEvent({
      url: '/your-relative-or-absolute-url',
      responses: [
        { type: 'a message event', data: 'a short message' }
      ]
    });

    const evtSource = new EventSource('/your-relative-or-absolute-url');
    let eventHandled = false;
    let handlerCallCount = 0;
    await new Promise((resolve) => {
      evtSource.addEventListener('a message event', (event) => {
        expect(event.type).to.equal('a message event');
        expect(event.data).to.equal('a short message');
        eventHandled = true;
        handlerCallCount += 1;
        if (handlerCallCount === numberOfEvents) resolve();
      });
    });

    flags.onCleanup = () => {
      expect(eventHandled).to.be.true();
      expect(handlerCallCount).to.equal(1);
      mockEvent.clear();
    };
  });


  it(' - should handle an event to full url', async (flags) => {
    const numberOfEvents = 1;

    const mockEvent = new MockEvent({
      url: 'http://noPlaceLikeHome:2000/your-route',
      responses: [
        { type: 'a message event', data: 'a short message' }
      ]
    });

    const evtSource = new EventSource('http://noPlaceLikeHome:2000/your-route');
    let eventHandled = false;
    let handlerCallCount = 0;
    await new Promise((resolve) => {
      evtSource.addEventListener('a message event', (event) => {
        expect(event.type).to.equal('a message event');
        expect(event.data).to.equal('a short message');
        expect(event.origin).to.equal('http://noPlaceLikeHome:2000');
        eventHandled = true;
        handlerCallCount += 1;
        if (handlerCallCount === numberOfEvents) resolve();
      });
    });

    flags.onCleanup = () => {
      expect(eventHandled).to.be.true();
      expect(handlerCallCount).to.equal(1);
      mockEvent.clear();
    };
  });


  it(' - should handle an event with setInterval, and collection of full responses', async (flags) => {
    const { context: { incrementCallCount } } = flags;
    const eventIdOne = pseudoRandId();
    const eventIdTwo = pseudoRandId();
    const eventIdthree = pseudoRandId();

    const mockEvent = new MockEvent({
      url: 'http://noPlaceLikeHome:2000/your-route',
      setInterval: 10,
      responses: [
        { lastEventId: eventIdOne, type: 'progressEvent', data: { progress: 'Look mum, I am making great progress' } },
        { lastEventId: eventIdTwo, type: 'pctCompleteEvent', data: { pctComplete: 11 } },
        { lastEventId: eventIdthree, type: 'temperatureEvent', data: { temperature: 25 } }
      ]
    });
    const evtSource = new EventSource('http://noPlaceLikeHome:2000/your-route');
    const handlerCallCounts = [{ progressEvent: 0 }, { pctCompleteEvent: 0 }, { temperatureEvent: 0 }];
    await new Promise((resolve) => {
      const resolveIfDone = () => {
        if (handlerCallCounts.filter(cntr => cntr[Object.keys(cntr)[0]] === calledOnce).length === handlerCallCounts.length) resolve();
      };
      evtSource.addEventListener('progressEvent', (event) => {
        expect(event.type).to.equal('progressEvent');
        expect(event.data).to.equal({ progress: 'Look mum, I am making great progress' });
        expect(event.origin).to.equal('http://noPlaceLikeHome:2000');
        expect(event.lastEventId).to.equal(eventIdOne);
        incrementCallCount(event.type, handlerCallCounts);
        resolveIfDone();
      });
      evtSource.addEventListener('pctCompleteEvent', (event) => {
        expect(event.type).to.equal('pctCompleteEvent');
        expect(event.data).to.equal({ pctComplete: 11 });
        expect(event.origin).to.equal('http://noPlaceLikeHome:2000');
        expect(event.lastEventId).to.equal(eventIdTwo);
        incrementCallCount(event.type, handlerCallCounts);
        resolveIfDone();
      });
      evtSource.addEventListener('temperatureEvent', (event) => {
        expect(event.type).to.equal('temperatureEvent');
        expect(event.data).to.equal({ temperature: 25 });
        expect(event.origin).to.equal('http://noPlaceLikeHome:2000');
        expect(event.lastEventId).to.equal(eventIdthree);
        incrementCallCount(event.type, handlerCallCounts);
        resolveIfDone();
      });
    });

    flags.onCleanup = () => { mockEvent.clear(); };
  });


  it(' - onopen handler should be called when the "open" event is received', async (flags) => {
    const { context: { incrementCallCount } } = flags;
    const eventIdOne = pseudoRandId();

    const mockEvent = new MockEvent({
      url: 'http://noPlaceLikeHome:2000/your-route',
      setInterval: 1,
      responses: [
        { lastEventId: eventIdOne, type: 'yourEvent', data: { yourProp: 'Oh, wow, nearly done!' } }
      ]
    });
    const evtSource = new EventSource('http://noPlaceLikeHome:2000/your-route');
    const handlerCallCounts = [{ onopen: 0 }, { yourEvent: 0 }];
    await new Promise((resolve) => {
      const resolveIfDone = () => {
        if (handlerCallCounts.filter(cntr => cntr[Object.keys(cntr)[0]] === calledOnce).length === handlerCallCounts.length) resolve();
      };
      evtSource.onopen = (event) => {
        const expectedEvent = { message: 'The opening message.', anotherCustomeProp: { prop: 'whatever' } }; // You can see this in the SUT.
        expect(event).to.equal(expectedEvent);
        expect(handlerCallCounts[0].onopen).to.equal(0);
        expect(handlerCallCounts[1].yourEvent).to.equal(0);
        incrementCallCount('onopen', handlerCallCounts);
      };
      evtSource.addEventListener('yourEvent', (event) => {
        expect(event.type).to.equal('yourEvent');
        expect(event.data).to.equal({ yourProp: 'Oh, wow, nearly done!' });
        expect(event.origin).to.equal('http://noPlaceLikeHome:2000');
        expect(event.lastEventId).to.equal(eventIdOne);
        expect(handlerCallCounts[0].onopen).to.equal(1);
        incrementCallCount(event.type, handlerCallCounts);
        resolveIfDone();
      });
    });

    flags.onCleanup = () => { mockEvent.clear(); };
  });


  it(' - should invoke error handler if no responses or response function provided', async (flags) => {
    const mockEvent = new MockEvent({ url: 'http://noPlaceLikeHome:2000/your-route' });
    const evtSource = new EventSource('http://noPlaceLikeHome:2000/your-route');
    let errorHandlerInvoked = false;
    await new Promise((resolve) => {
      evtSource.onerror = (error) => {
        expect(error.message).to.equal('Handler for URL "http://noPlaceLikeHome:2000/your-route" requires response type attribute');
        errorHandlerInvoked = true;
        resolve();
      };
    });

    flags.onCleanup = () => {
      expect(errorHandlerInvoked).to.be.true();
      mockEvent.clear();
    };
  });


  it(' - response function should be called', async (flags) => {
    const eventIdOne = pseudoRandId();
    const eventData = { lastEventId: eventIdOne, type: 'yourEvent', data: { yourProp: 'Oh, wow, nearly done!' } };
    const mockEvent = new MockEvent({
      url: 'http://noPlaceLikeHome:2000/your-route',
      setInterval: 1,
      response: (handler, evtSource) => { // eslint-disable-line no-unused-vars
        const data = [eventData];
        handler.stream(data);
      }
    });

    const evtSource = new EventSource('http://noPlaceLikeHome:2000/your-route');
    let eventHandlerInvoked = false;
    await new Promise((resolve) => {
      evtSource.addEventListener('yourEvent', (event) => {
        expect(event).to.equal({ ...eventData, origin: event.origin });
        eventHandlerInvoked = true;
        resolve();
      });
    });

    flags.onCleanup = () => {
      expect(eventHandlerInvoked).to.be.true();
      mockEvent.clear();
    };
  });


  it(' - responses with no elements should pass error to error handler', async (flags) => {
    const mockEvent = new MockEvent({
      url: 'http://noPlaceLikeHome:2000/your-route',
      responses: []
    });

    const evtSource = new EventSource('http://noPlaceLikeHome:2000/your-route');
    let errorHandlerInvoked = false;
    await new Promise((resolve) => {
      evtSource.onerror = (error) => {
        expect(error.message).to.equal('Handler for URL "http://noPlaceLikeHome:2000/your-route" requires response type attribute');
        errorHandlerInvoked = true;
        resolve();
      };
    });

    flags.onCleanup = () => {
      expect(errorHandlerInvoked).to.be.true();
      mockEvent.clear();
    };
  });


  it(' - responses with empty elements should dispatchError to error handler', async (flags) => {
    const mockEvent = new MockEvent({
      url: 'http://noPlaceLikeHome:2000/your-route',
      responses: [{}, {}]
    });

    const evtSource = new EventSource('http://noPlaceLikeHome:2000/your-route');
    let errorHandlerInvoked = false;
    await new Promise((resolve) => {
      evtSource.onerror = (error) => {
        expect(error.message).to.equal('`type` and `data` are required on mock handler response object');
        errorHandlerInvoked = true;
        resolve();
      };
    });

    flags.onCleanup = () => {
      expect(errorHandlerInvoked).to.be.true();
      mockEvent.clear();
    };
  });


  it(' - closing the EventSource then subscribing to an event should invoke the error handler', async (flags) => {
    const mockEvent = new MockEvent({
      url: 'http://noPlaceLikeHome:2000/your-route',
      verbose: true,
      responses: [
        { type: 'a message event', data: 'a short message' }
      ]
    });

    const evtSource = new EventSource('http://noPlaceLikeHome:2000/your-route');

    evtSource.close();

    await new Promise((resolve) => {
      evtSource.addEventListener('a message event', (event) => { // eslint-disable-line no-unused-vars
        fail('The event handler should not be invoked on a closed EventSource.');
      });
      evtSource.onerror = (error) => {
        expect(error.message).to.equal('`EventSource` instance closed while sending.');
        resolve();
      };
    });

    flags.onCleanup = () => {
      mockEvent.clear();
    };
  });


  it(' - interval should deliver correct numbers based on input range', async (flags) => {
    let iterationCount = 0;
    let firstElement = 100;
    let secondElement = 200;
    const elementSwaps = 2;
    const innerIterations = 100;

    for (let elementPermatationIncrementer = 0; elementPermatationIncrementer < elementSwaps; elementPermatationIncrementer += 1) {
      const mockEvent = new MockEvent({
        url: 'http://noPlaceLikeHome:2000/your-route',
        setInterval: [firstElement, secondElement],
        responses: [{ type: 'a message event', data: 'a short message' }]
      });

      for (let i = 0; i < innerIterations; i += 1) {
        expect(mockEvent.interval()).to.be.within(100, 200);
        iterationCount += 1;
      }

      const temp = secondElement;
      secondElement = firstElement;
      firstElement = temp;
      mockEvent.clear();
    }

    flags.onCleanup = () => { expect(iterationCount).to.equal(innerIterations * elementSwaps); };
  });


  it(' - an event with different url to the EventSource should fail with meaningful error', async (flags) => {
    const eventSourceUrl = 'http://noPlaceLikeHome:2000/your-route';
    const mockEvent = new MockEvent({
      url: 'http://noPlaceLikeHome:2000/foo-bar',
      responses: [{ type: 'a message event', data: 'a short message' }]
    });

    const evtSource = new EventSource(eventSourceUrl);
    await new Promise((resolve) => {
      evtSource.addEventListener('a message event', (event) => { // eslint-disable-line no-unused-vars
        fail('The event handler should not be invoked on an incorrect event url.');
      });
      evtSource.onerror = (error) => {
        expect(error.message).to.equal(`There was no event handler found for EventSource with url: ${eventSourceUrl}`);
        resolve();
      };
    });

    flags.onCleanup = () => { mockEvent.clear(); };
  });
});
