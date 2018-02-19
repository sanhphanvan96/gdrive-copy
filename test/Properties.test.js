global.PropertiesService = require('./mocks/PropertiesService');
global.Utilities = require('./mocks/Utilities');
const Properties = require('../lib/Properties');
const GDriveService = require('../lib/GDriveService');
const sinon = require('sinon');
const assert = require('assert');
const fs = require('fs');

describe('Properties', function() {
  beforeEach(function() {
    this.properties = new Properties();
    this.mockPropertiesDoc = fs
      .readFileSync('test/mocks/properties_document_stringified.txt')
      .toString();
  });
  describe('loadProperties()', function() {
    it('should assign properties to `this`', function() {
      // set up mocks
      const stubFile = sinon.stub(GDriveService, 'downloadFile');
      stubFile.returns(this.mockPropertiesDoc);

      // set up actual
      const loadedProps = this.properties.loadProperties.call(this.properties);

      // assertions
      assert.deepEqual(loadedProps, JSON.parse(this.mockPropertiesDoc));

      // reset mocks
      stubFile.restore();
    });
    it('should return parsing error if not JSON-parsable', function() {
      // set up mocks
      const stubFile = sinon.stub(GDriveService, 'downloadFile');
      stubFile.returns(this.mockPropertiesDoc.slice(3));

      // assertions
      assert.throws(() => {
        this.properties.loadProperties.call(this.properties);
      }, "Unable to parse the properties document. This is likely a bug, but it is worth trying one more time to make sure it wasn't a fluke.");

      // reset mocks
      stubFile.restore();
    });
    it('should return human readable error if propertiesDocID is undefined', function() {
      // set up mocks
      const stubFile = sinon.stub(GDriveService, 'downloadFile');
      stubFile.throws(new Error('Unsupported Output Format'));

      // assertions
      assert.throws(() => {
        this.properties.loadProperties.call(this.properties);
      }, 'Could not determine properties document ID. Please try running the script again');

      // reset mocks
      stubFile.restore();
    });
  });
  describe('saveProperties()', function() {
    it('should throw critical error if properties cannot be serialized', function() {
      function Circular() {
        this.abc = 'Hello';
        this.circular = this;
      }
      const circular = new Circular();
      assert.throws(() => {
        Properties.saveProperties(circular);
      }, 'Failed to serialize script properties. This is a critical failure. Please start your copy again.');
    });
    it('should update file with stringified props', function() {
      // set up mocks
      const stubUpdate = sinon.stub(GDriveService, 'updateFile');

      // set up actual
      const myProps = {
        prop1: 1,
        prop2: 2,
        leftovers: [
          { id: 123, parents: [{ id: 234 }] },
          { id: 345, parents: [{ id: 985 }] }
        ],
        map: {
          prop3: 3,
          prop4: 4
        }
      };
      Properties.saveProperties(myProps);

      // assertions
      assert.equal(
        stubUpdate.getCall(0).args[2],
        JSON.stringify(myProps),
        'properties argument not stringified correctly'
      );
    });
  });
});
