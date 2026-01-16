import { Router, Route, Switch } from 'wouter'
import { TopBar } from './components/Layout/TopBar'
import { SideBar } from './components/Layout/SideBar'
import { Dashboard } from './routes/dashboard'
import { Analytics } from './routes/analytics'
import { Settings } from './routes/settings'

function App() {
  return (
    <Router>
      <div className="app-layout">
        <TopBar />
        <div className="app-body">
          <SideBar />
          <main className="app-content">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/analytics" component={Analytics} />
              <Route path="/settings" component={Settings} />
              <Route>
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  <h2>404 - Page Not Found</h2>
                  <p>The page you are looking for does not exist.</p>
                </div>
              </Route>
            </Switch>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App
