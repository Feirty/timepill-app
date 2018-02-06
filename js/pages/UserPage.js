import React, { Component } from 'react';
import {Text, View, StyleSheet, Animated, Dimensions, DeviceEventEmitter} from "react-native";
import DiaryList from "../components/DiaryList";
import UserDiaryData from "../common/UserDiaryData";
import LocalIcons from "../common/LocalIcons";
import {TabViewAnimated, TabBar, SceneMap, TabViewPagerPan, TabViewPagerScroll} from 'react-native-tab-view';
import {colors} from "../Styles";
import Events from "../Events";
import * as Api from "../Api";

const initialLayout = {
    height: 0,
    width: Dimensions.get('window').width,
};

export default class UserPage extends Component {

    static navigatorStyle = {
        navBarNoBorder: true,
        topBarElevationShadowEnabled: false,
        topBarBorderColor: '#FFF',
    };

    static appStyle = {

    };

    constructor(props) {
        super(props);
        this.state = {
            isMyself: props.isMyself,
            index: 0,
            routes: [
                { key: 'diary', title: '日记' },
                { key: 'notebooks', title: '日记本' },
                { key: 'user', title: '简介' }
            ],
            visible: true,
        };
        this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
    }

    onNavigatorEvent(event) {
        if (event.id === 'willAppear') {
            this.setState({
                visible: true
            });
        }
        if (event.id === 'willDisappear') {
            this.setState({
                visible: false
            });
        }
    }


    componentDidMount() {
        if (this.props.isMyself) {
            this.loginListener = DeviceEventEmitter.addListener(Events.login, () => {
                //TODO:刷新日记本和个人信息
                this.diaryList.refresh()
            });
            this.deleteListener = DeviceEventEmitter.addListener(Events.diaryDelete, () => {
                //TODO:刷新日记本和个人信息
                this.diaryList.refresh()
            });
        }
        this.loadNavButtons();
    }

    async loadNavButtons() {
        if (this.props.isMyself) {
            this.props.navigator.setButtons({
                rightButtons: [{ id: 'setting', icon: LocalIcons.navButtonSetting }],
                animated: false
            });
        } else {
            const uid = this.getId();
            const rel = await Api.getRelation(uid);
            const icon = rel ? LocalIcons.navButtonFollowSelected : LocalIcons.navButtonFollow;
            this.props.navigator.setButtons({
                rightButtons: [{ id: 'setting', icon: icon, disableIconTint: true }],
                animated: true
            });
        }
    }

    getId() {
        return this.props.user != null ? this.props.user.id : this.props.user_id;
    }

    componentWillUnmount() {
        if (this.loginListener) {
            this.loginListener.remove();
            this.deleteListener.remove();
        }
    }


    _renderScene = SceneMap({
        diary: () => <DiaryList
            ref={(r) => this.diaryList = r }
            tabLabel="日记"
            dataSource={new UserDiaryData(this.getId())}
            navigator={this.props.navigator}
            editable={this.props.isMyself}
        />,
        notebooks: () => <View tabLabel="简介"><Text>1</Text></View>,
        user: () => <View tabLabel="日记本"><Text>2</Text></View>
    });

    _handleIndexChange = index => this.setState({ index });

    _renderHeader = props => {
        // this.props.navigator.setStyle({
        //     navBarCustomView: 'TabBar',
        //     navBarComponentAlignment: 'center',
        //     navBarCustomViewInitialProps: {
        //         navigator: this.props.navigator,
        //         ...props,
        //         pressColor: colors.textSelect,
        //         // onTabPress={this._handleTabItemPress}
        //         renderLabel: _renderLabel(props),
        //         indicatorStyle: styles.indicator,
        //         tabStyle: styles.tab,
        //         style: styles.tabbar
        //     }
        // });
        // return null;
        return <TabBar
            {...props}
            pressColor="transparent"
            indicatorStyle={styles.indicator}
            renderLabel={_renderLabel(props)}
            tabStyle={styles.tab}
            style={styles.tabbar}
        />
    };

    _renderPager = props => <TabViewPagerPan {...props} />;

    render() {
        return (
                <TabViewAnimated
                    style={[styles.container, {flex: this.state.visible ? 1 : 0}]}
                    navigationState={this.state}
                    renderScene={this._renderScene}
                    renderHeader={this._renderHeader}
                    onIndexChange={this._handleIndexChange}
                    initialLayout={initialLayout}
                    // renderPager={this._renderPager}
                />
        )
    }
}

_renderLabel = props => ({ route, index }) => {
    const inputRange = props.navigationState.routes.map((x, i) => i);
    const outputRange = inputRange.map(
        inputIndex => (inputIndex === index ? colors.primary : '#222')
    );
    const color = props.position.interpolate({
        inputRange,
        outputRange,
    });

    return (
        <Animated.Text style={[styles.label, { color }]}>
            {route.title}
        </Animated.Text>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF'
    },
    indicator: {
        backgroundColor: colors.primary,
    },
    label: {
        flex: 1,
        fontSize: 13,
        fontWeight: 'bold',
        margin: 8,
        marginTop: -6,
    },
    tabbar: {
        backgroundColor: colors.navBackground,
        justifyContent: 'center',
    },
    tab: {
        flex: 1,
        opacity: 1,
    },
    page: {
        backgroundColor: '#f9f9f9',
    },
});