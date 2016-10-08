
module.exports = {
  rules: {
    myrule: {
      type: 'object',
      required: ['subject', 'environment'],
      properties: {
        subject: {
          type: 'object',
          required: ['staff', 'department'],
          properties: {
            staff: {
              type: 'boolean',
              enum: [true]
            },
            department: {
              type: 'string',
              enum: ['Computer Science', 'Information Systems']
            }
          }
        },
        environment: {
          type: 'object',
          properties: {
            time: {
              type: 'object',
              required: ['hours', 'minutes'],
              anyOf: [
                {
                  properties: { 
                    hours: {
                      type: 'number',
                      minimum: 7,
                      maximum: 17
                    },
                    minutes: {
                      type: 'number',
                      minimum: 30
                    }
                  }
                },
                {
                  properties: {
                    hours: {
                      type: 'number',
                      maximum: 17,
                      minimum: 8
                    }
                  }
                }
              ]
            }
          }
        }
      }
    }
  }
}