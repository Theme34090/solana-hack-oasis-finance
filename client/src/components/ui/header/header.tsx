import { useState } from "react";
import { NavLink } from "react-router-dom";

import Button from "../button/button";
import classes from "./header.module.css";

import { useWallet, WALLET_PROVIDERS } from "../../../store/wallet";
import DropdownItem from "../dropdown/dropdown-item/dropdown-item";

import AppLogo from "../../../assets/logo.png";

interface HeaderProps {}

const Header: React.FC<HeaderProps> = (): JSX.Element => {
  const [show, setShow] = useState<boolean>(false);

  const { connected, displayKey, connectWallet, wallet } = useWallet();

  const toggleDropDown = () => {
    setShow((prevState) => !prevState);
  };

  const onSelectProvider = (providerUrl: String) => {
    setShow(false);
    connectWallet(providerUrl);
  };

  const onDisconnected = () => {
    setShow(false);
    wallet.disconnect();
  };

  const dropDownMenu = !connected ? (
    WALLET_PROVIDERS.map((provider) => (
      <DropdownItem
        key={provider.name}
        clicked={onSelectProvider.bind(this, provider.url)}
        // clicked={!connected ? wallet.connect : wallet.disconnect}
      >
        {provider.name}
      </DropdownItem>
    ))
  ) : (
    <DropdownItem clicked={onDisconnected}>Disconnect</DropdownItem>
  );

  return (
    <header className={classes.MainHeader}>
      <nav className={classes.Logo}>
        <NavLink to="/">
          {/* <img src="" alt="" className="logo-img" /> */}
          <img src={AppLogo} />
        </NavLink>
      </nav>
      <nav className={classes.MainNav}>
        <ul className={classes.MainNavItems}>
          <li className={classes.MainNavItem}>
            <NavLink activeClassName={classes.active} to="/lp">
              Provide LP
            </NavLink>
          </li>
          <li className={classes.MainNavItem}>
            <NavLink activeClassName={classes.active} to="/token">
              VIEW TOKEN ACCOUNT
            </NavLink>
          </li>
          <li className={classes.Dropdown}>
            <Button clicked={toggleDropDown} disabled={false}>
              {displayKey === "" ? "Connect to Wallet" : displayKey}
            </Button>
            {show ? (
              <div className={classes.DropdownMenu}>{dropDownMenu}</div>
            ) : null}
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
