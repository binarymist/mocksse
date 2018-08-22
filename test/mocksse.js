exports.lab = require('lab').script();

const { describe, it, before, beforeEach, afterEach } = exports.lab;

const { expect, fail } = require('code');
const sinon = require('sinon');
const rewire = require('rewire');
const readFileAsync = require('util').promisify(require('fs').readFile);

const { MockEvent, EventSource } = require('../src//mocksse');


describe('Mock EventSource', () => {
  it('- should handle an event', async (flags) => {
    const numberOfEvents = 1;
    const mockEvent = new MockEvent({
      url: '/your-relative-or-absolute-url',
      responses: [
        { type: 'tweet', data: 'a tweet' }
      ]
    });

    const evtSource = new EventSource('/your-relative-or-absolute-url');
    let eventHandled = false;
    let handlerCallCount = 0;
    await new Promise((resolve) => {
      evtSource.addEventListener('tweet', (event) => {
        expect(event.type).to.equal('tweet');
        expect(event.data).to.equal('a tweet');
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
});

