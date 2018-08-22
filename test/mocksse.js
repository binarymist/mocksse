exports.lab = require('lab').script();

const { describe, it, before, beforeEach, afterEach } = exports.lab;

const { expect, fail } = require('code');
const sinon = require('sinon');
const rewire = require('rewire');
const readFileAsync = require('util').promisify(require('fs').readFile);

const { MockEvent, EventSource } = require('../src//mocksse');
const pseudoRandId = () => Math.random().toString().substring(2);


describe('Mock EventSource', () => {
  it('- should handle an event to relative url', async (flags) => {
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


  it('- should handle an event to full url', async (flags) => {
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


  it('- should handle an event with setInterval, and collection of full responses', async (flags) => {
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

    const incrementCallCount = (eventType) => {
      handlerCallCounts.find(counter => Object.keys(counter)[0] === eventType)[eventType] += 1;
    };

    await new Promise((resolve) => {
      const calledOnce = 1;
      const resolveIfDone = () => { if (handlerCallCounts.filter(counter => counter[Object.keys(counter)[0]] === calledOnce).length === handlerCallCounts.length) resolve(); };

      evtSource.addEventListener('progressEvent', (event) => {
        expect(event.type).to.equal('progressEvent');
        expect(event.data).to.equal({ progress: 'Look mum, I am making great progress' });
        expect(event.origin).to.equal('http://noPlaceLikeHome:2000');
        expect(event.lastEventId).to.equal(eventIdOne);
        incrementCallCount(event.type);
        resolveIfDone();
      });
      evtSource.addEventListener('pctCompleteEvent', (event) => {
        expect(event.type).to.equal('pctCompleteEvent');
        expect(event.data).to.equal({ pctComplete: 11 });
        expect(event.origin).to.equal('http://noPlaceLikeHome:2000');
        expect(event.lastEventId).to.equal(eventIdTwo);
        incrementCallCount(event.type);
        resolveIfDone();
      });
      evtSource.addEventListener('temperatureEvent', (event) => {
        expect(event.type).to.equal('temperatureEvent');
        expect(event.data).to.equal({ temperature: 25 });
        expect(event.origin).to.equal('http://noPlaceLikeHome:2000');
        expect(event.lastEventId).to.equal(eventIdthree);
        incrementCallCount(event.type);
        resolveIfDone();
      });
    });

    flags.onCleanup = () => { mockEvent.clear(); };
  });
});

