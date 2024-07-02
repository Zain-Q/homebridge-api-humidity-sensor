const axios = require('axios');

module.exports = (api) => {
  api.registerAccessory('HumiditySensorPlugin', HumiditySensorAccessory);
};

class HumiditySensorAccessory {

  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;

    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;

    // extract name from config
    this.name = config.name;

    // create a new Humidity Sensor service
    this.service = new this.Service.HumiditySensor(this.name);

    // create handlers for required characteristics
    this.service.getCharacteristic(this.Characteristic.CurrentRelativeHumidity)
      .onGet(this.handleCurrentRelativeHumidityGet.bind(this));

    // Set an interval to update the humidity value periodically
    if (config.updateInterval && config.updateInterval > 0) {
      setInterval(this.updateHumidity.bind(this), config.updateInterval * 1000);
    }
  }

  /**
   * Handle requests to get the current value of the "Current Relative Humidity" characteristic
   */
  async handleCurrentRelativeHumidityGet() {
    this.log.debug('Triggered GET CurrentRelativeHumidity');

    try {
      const response = await axios.get('http://192.168.100.4/humidity');
      const humidity = response.data.humidity; // adjust according to the structure of your response
      this.log.debug('Current Humidity: ' + humidity);
      return humidity;
    } catch (error) {
      this.log.error('Error getting humidity:', error);
      throw new this.api.hap.HapStatusError(this.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  async updateHumidity() {
    try {
      const response = await axios.get('http://192.168.100.4/humidity');
      const humidity = response.data.humidity; // adjust according to the structure of your response
      this.service.getCharacteristic(this.Characteristic.CurrentRelativeHumidity).updateValue(humidity);
      this.log.debug('Updated Humidity: ' + humidity);
    } catch (error) {
      this.log.error('Error updating humidity:', error);
    }
  }

  /**
   * Required by Homebridge to retrieve available services for this accessory
   */
  getServices() {
    return [this.service];
  }
}

