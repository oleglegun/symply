import updateNotifier from 'update-notifier'
import pkg from '../package.json'

const notifier = updateNotifier({ pkg, updateCheckInterval: 0 })

notifier.notify({ isGlobal: true })
