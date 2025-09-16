import { Layout } from 'antd'
import { Router, Route, Switch } from 'wouter'
import { TopBar } from './components/Layout/TopBar'
import { SideBar } from './components/Layout/SideBar'
import { Dashboard } from './routes/dashboard'
import { Analytics } from './routes/analytics'
import { Settings } from './routes/settings'

const { Content } = Layout

function App() {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <TopBar />
        <Layout>
          <SideBar />
          <Layout style={{ padding: '0' }}>
            <Content
              style={{
                margin: 0,
                minHeight: 280,
                background: '#f0f2f5',
              }}
            >
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
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </Router>
  )
}

export default App
