import expressStatusMonitor from 'express-status-monitor'

// FIXME: lock behind admin
export const configureStatusMonitor = (app) => {
  app.use(expressStatusMonitor({
    title: 'NMRiH Stats',
    path: '/status',
    spans: [{
      interval: 1,
      retention: 60
    }, {
      interval: 5,
      retention: 60
    }, {
      interval: 15,
      retention: 60
    }],
    chartVisibility: {
      cpu: true,
      mem: true,
      load: true,
      responseTime: true,
      rps: true,
      statusCodes: true
    },
    healthChecks: [{
      protocol: 'http',
      host: 'localhost',
      path: '/',
      port: '3000'
    }]
  }))
}
