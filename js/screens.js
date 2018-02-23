import React, { Component } from 'react';
import { Navigation } from 'react-native-navigation';
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import DiaryDetail from "./pages/DiaryDetailPage";
import PhotoPage from "./pages/PhotoPage";
import UserPage from "./pages/UserPage";
import NotificationPage from "./pages/NotificationPage";
import FollowDiaryPage from "./pages/FollowDiaryPage";
import WritePage from "./pages/WritePage";
import NotebookPage from './pages/NotebookPage';

import {Text, View} from "react-native";

import { TabViewAnimated, TabBar, SceneMap } from 'react-native-tab-view';
import TestPage from "./pages/TestPage";
import NotebookAddPage from "./pages/NotebookAddPage";
import SettingPage from "./pages/SettingPage";
import AboutPage from "./pages/AboutPage";


/**
 * @return {null}
 */
function WriteTab(props) {
    let navigator = props.navigator;
    navigator.setOnNavigatorEvent(event => {
        if (event.selectedTabIndex === 2) {
            navigator.showModal({
                screen: 'Write',
                title: "写日记",
                // overrideTabPress: true
            });

            let tabIndexToSelect = !event.unselectedTabIndex || event.unselectedTabIndex === 2 ? 0 : event.unselectedTabIndex;

            navigator.switchToTab({
                tabIndex: tabIndexToSelect
            });
        }
    });
    return <View style={{backgroundColor: 'transparent'}} />;
}

WriteTab.navigatorStyle = {
    tabBarHidden: true,
    navBarHidden: true,
};

function UserHeader(props) {
    return (
        <View style={{backgroundColor: 'red', padding: 20}}>
            <Text>Hello, world!{ props.title}</Text>
        </View>
    );
}

export function registerScreens() {
    Navigation.registerComponent('Home', () => HomePage);
    Navigation.registerComponent('Follow', () => FollowDiaryPage);
    Navigation.registerComponent('Login', () => LoginPage);
    Navigation.registerComponent('DiaryDetail', () => DiaryDetail);
    Navigation.registerComponent('Photo', () => PhotoPage);
    Navigation.registerComponent('User', () => UserPage);
    Navigation.registerComponent('Notification', () => NotificationPage);
    Navigation.registerComponent('Write', () => WritePage);
    Navigation.registerComponent('WriteTab', () => WriteTab);
    Navigation.registerComponent('Notebook', () => NotebookPage);
    Navigation.registerComponent('NotebookAdd', () => NotebookAddPage);
    Navigation.registerComponent('Setting', () => SettingPage);
    Navigation.registerComponent('About', () => AboutPage);

    Navigation.registerComponent('Test', () => TestPage);

    Navigation.registerComponent('UserHeader', () => UserHeader);

    Navigation.registerComponent('TabBar', () => TabBar);
}