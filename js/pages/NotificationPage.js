import React, { Component } from 'react';
import {
    Text, View, NativeAppEventEmitter, Platform, ListView, InteractionManager, StyleSheet, RefreshControl,
    ActivityIndicator, DeviceEventEmitter
} from "react-native";
import ErrorView from "../components/ErrorView";
import JPushModule from 'jpush-react-native';
import * as Api from "../Api";
import TPTouchable from "../components/TPTouchable";
import Icon from 'react-native-vector-icons/Ionicons';
import {colors} from '../Styles'
import Events from "../Events";
import Fabric, {Crashlytics} from 'react-native-fabric';
import {updatePushInfo} from "../Api";
import LocalIcons from "../common/LocalIcons";

const LOOP_TIME_SHORT = 30 * 1000;
const LOOP_TIME_LONG = 60 * 1000;

export default class NotificationPage extends Component {

    static get navigatorButtons() {
        return {
            rightButtons: [{
                id: "history",
                icon: LocalIcons.navButtonTime
            }]
        }
    }

    constructor(props) {
        super(props);
        const ds = new ListView.DataSource({
            rowHasChanged: (r1, r2) => r1 !== r2
        });
        this.state = ({
            messages: [],
            messagesDataSource: ds,
            refreshing: true,
        });
    }

    loading = false;
    loopTime = LOOP_TIME_LONG;
    tipTimer = null;

    componentDidMount() {
        InteractionManager.runAfterInteractions(() => {
            if (Platform.OS === 'android') {
                this.initAndroid().done()
            } else {
                this.initIOS().done()
            }

            this.restartTipTimer().done();
        });
        this.loginListener = DeviceEventEmitter.addListener(Events.login, () => {
            this.registerUser().done();
            this.restartTipTimer().done();
        });
        this.updatePushInfo().done();

        this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
    }

    onNavigatorEvent(event) {
        if (event.id === 'history') {
            this.props.navigator.push({
                screen: 'NotificationHistory',
                title: '提醒历史',
            })
        }
    }

    componentWillUnmount() {
        this.loginListener.remove();
    }

    async updatePushInfo() {
        let info;
        try {
            info = await Api.updatePushInfo()
        } catch (err) {
        }
        // console.log('updatePushInfo', info)
    }

    async restartTipTimer() {
        if (this.tipTimer) {
            clearTimeout(this.tipTimer);
        }

        try {
            await this._loadMessages();
        } catch(err) {
            console.log(err);
        }
        // console.log('[message] loop time:' + this.loopTime);
        this.tipTimer = setTimeout(() => {
            this.restartTipTimer().done();
        }, this.loopTime)
    }

    async initAndroid() {
        JPushModule.notifyJSDidLoad((resultCode) => {
            console.log('JPushModule.notifyJSDidLoad:' + resultCode);
            if (resultCode !== 0) {
                return;
            }
            this.registerUser().done();

            JPushModule.addReceiveNotificationListener((map) => {
                console.log("alertContent: " + map.alertContent);
                this.restartTipTimer().done();
            });

            JPushModule.addReceiveOpenNotificationListener((r) => {
                this.restartTipTimer().done();
                console.log('JPushModule.addReceiveOpenNotificationListener', r);
            });
        });
    }

    async initIOS() {
        JPushModule.getRegistrationID((registrationId) => {
            console.log("Device register succeed, registrationId " + registrationId);
        });

        this.registerUser().done();

        JPushModule.addReceiveNotificationListener(map => {
            console.log('JPushModule.addReceiveNotificationListener', map);
            this.restartTipTimer().done();
        });

        JPushModule.addReceiveOpenNotificationListener(map => {
            console.log('JPushModule.addReceiveOpenNotificationListener', map);
            this.restartTipTimer().done();
        });
    }

    async registerUser() {
        const user = await Api.getSelfInfoByStore();
        if (!user || !user.id) return;
        const settings = await Api.getSettings();
        const push = settings['pushMessage'];
        const alias = push ? user.id.toString() : user.id.toString() + '_close';
        JPushModule.setAlias(alias, success => {
            console.log('JPushModule.setAlias ' + alias + '  ' + success);
        });

        Crashlytics.setUserName(user.name);
        Crashlytics.setUserEmail(user.email);
        Crashlytics.setUserIdentifier(user.id.toString());
    }

    async _loadMessages() {
        let user = await Api.getSelfInfoByStore();
        if (!user || this.loading) {
            this.setState({
                refreshing: false,
            });
            return;
        }
        this.loading = true;
        let list = [];
        try {
            list = await Api.getMessages(0);
        } catch (err) {
        }
        this.loading = false;
        //console.log(list);
        this._setMsgList(list);
    }

    _setMsgList(list) {
        const rowData = list
            .reduce((ret, v) => {
                if (v.type === 2) {  //关注
                    ret.push(v);
                }
                if (v.type === 1) {  //回复
                    const items = ret.filter(x => x.type === 1 && x.link_id === v.link_id);
                    if (items.length > 0) {
                        items[0].list.push(v);
                    } else {
                        ret.push({
                            type: 1,
                            link_id: v.link_id,
                            created: v.created,
                            list: [v]
                        });
                    }
                }
                return ret;
            }, []);

        this.setState({
            messagesDataSource: this.state.messagesDataSource.cloneWithRows(rowData),
            messages: list,
            refreshing: false,
        });

        this.props.navigator.setTabBadge({
            tabIndex: 3,
            badge: list.length === 0 ? null : list.length,
            badgeColor: colors.danger,
        });

        if (Platform.OS === 'ios') {
            JPushModule.setBadge(list.length, (r) => {
                //alert("JPushModule.setBadge: " + JSON.stringify(r))
            })
        }
    }

    _onRefresh() {
        this.setState({
            refreshing: true,
        });
        this.restartTipTimer().done();
    }

    _onCommentPress(msg) {
        this.props.navigator.push({
            screen: 'DiaryDetail',
            title: '日记详情',
            passProps: {
                diary_id: msg.link_id,
                new_comments: msg.list.map(it => it.content.comment_id)
            }
        });
        this._setRead(msg).done();
    }

    _onFollowPress(msg) {
        this.props.navigator.push({
            screen: 'User',
            title: msg.content.user.name,
            passProps: { user: msg.content.user }
        });
        this._setRead(msg).done();
    }

    _onDeletePress(msg) {
        this._setRead(msg).done();
    }

    async _setRead(msg) {
        let ids = null;
        if (msg.type === 1) {    //回复
            ids = msg.list.map(it => it.id);
        } else if (msg.type === 2) {     //关注
            ids = [msg.id];
        }

        try {
            const newMsg = this.state.messages.filter((msg) => ids.indexOf(msg.id) === -1);
            this._setMsgList(newMsg);
            await Api.deleteMessage(ids);
        } catch (err) {
            console.log(err);
        }
    }

    refresh() {
        this.restartTipTimer().done()
    }

    render() {
        if (this.state.messages.length === 0) {
            return this.renderEmpty();
        }
        return (
            <View style={{flex: 1, backgroundColor: 'white'}}>
                <ListView
                    dataSource={this.state.messagesDataSource}
                    renderRow={(rowData) => this.renderMessage(rowData) }
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this._onRefresh.bind(this)}
                            colors={[colors.primary]}
                            tintColor={colors.primary} />
                    }
                    enableEmptySections={true}
                    automaticallyAdjustContentInsets={false}
                    removeClippedSubviews={false}
                />
            </View>
        )
    }

    renderMessage(msg) {
        if (msg.type === 1) {
            return this.renderComment(msg);
        } else if (msg.type === 2) {
            return this.renderFollow(msg);
        }

        return (
            <View />
        )
    }

    renderComment(msg) {
        const users = unique(msg.list.map(it => it.content.author.name)).join('、');
        const body = `${users} 回复了你`;
        return (
            <TPTouchable key={msg.link_id} onPress={() => this._onCommentPress(msg)}>
                <View style={styles.message}>
                    <Icon name="ios-text" size={16} style={styles.icon} color={colors.light} />
                    <Text style={{flex: 1, lineHeight: 20}}>{body}</Text>
                    <TPTouchable onPress={() => this._onDeletePress(msg)}>
                        <Icon name="md-close" size={16} style={styles.delete} color={colors.inactiveText} />
                    </TPTouchable>
                </View>
            </TPTouchable>
        )
    }

    renderFollow(msg) {
        const body = `${msg.content.user.name} 关注了你`;
        return (
            <TPTouchable key={msg.link_id} onPress={() => this._onFollowPress(msg)}>
                <View style={styles.message}>
                    <Icon name="ios-heart" size={16} style={styles.icon} color='#d9534f' />
                    <Text key={msg.link_id} style={{flex: 1, lineHeight: 20}}>{body}</Text>
                    <TPTouchable onPress={() => this._onDeletePress(msg)}>
                        <Icon name="md-close" size={16} style={styles.delete} color={colors.inactiveText} />
                    </TPTouchable>
                </View>
            </TPTouchable>
        )
    }

    renderEmpty() {
        if (this.state.refreshing) {
            return (
                <View style={{alignItems:'center', justifyContent: 'center' , height: '100%'}}>
                    <ActivityIndicator animating={true} color={colors.primary} size={Platform.OS === 'android' ? 'large' : 'small'}/>
                </View>
            )
        }
        let text = this.state.error ? '出错了 :(':'没有提醒 :)';
        return (
            <ErrorView text={text} buttonText="刷新一下" onButtonPress={this.refresh.bind(this)}/>
        );
    }
}

const styles = StyleSheet.create({
    message: {
        padding: 20,
        borderColor: colors.line,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row'
    },
    icon: {
        marginRight: 10,
        marginTop: 1,
        lineHeight: 20,
    },
    delete: {
        lineHeight: 20,
        paddingHorizontal: 8,
    }
});

function unique(array){
    let n = []; //一个新的临时数组
    //遍历当前数组
    for(let i = 0; i < array.length; i++){
        //如果当前数组的第i已经保存进了临时数组，那么跳过，
        //否则把当前项push到临时数组里面
        if (n.indexOf(array[i]) === -1) n.push(array[i]);
    }
    return n;
}