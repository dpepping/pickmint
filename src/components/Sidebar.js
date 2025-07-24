function Sidebar(){


    return(
        <aside className="sidebar">
          <nav>
            <ul>
              <li>
                <a href="/index"className="nav-item active">
                  <i className="icon-dashboard"></i> Dashboard
                </a>
              </li>
              <li>
                <a href="/my-leagues" className="nav-item">
                  <i className="icon-leagues"></i> My Leagues
                </a>
              </li>
              <li>
                <a href="/my-team" className="nav-item">
                  <i className="icon-teams"></i> My Teams
                </a>
              </li>
              <li>
                <ul className="submenu">
                  <li><a href="/join-league">Join League</a></li>
                  <li><a href="/create-league">Create New League</a></li>
                </ul>
              </li>
              <li>
                <a href="/standings"className="nav-item">
                  <i className="icon-standings"></i> Standings
                </a>
              </li>
            </ul>
          </nav>
        </aside>
    )
}

export default Sidebar;