import {StyleSheet, Platform} from "react-native";

const colors = {
    primary: '#007AFF',
    light: '#007AFF',
    text: '#484848',
    warning: '#ffdd57',
    danger: '#ff3860',

    inactiveText: '#9B9B9B',
    darkText: '#333333',
    lightText: '#7F91A7',

    spaceBackground: '#f3f3ff', //空内容背景
    // navBackground: Platform.OS === 'ios' ? '#F9F9F9' : '#FFFFFF',
    navBackground: '#F9F9F9',
    line: '#eee',
    textSelect: '#b6d8ff',

    refreshColor: '#007AFF',

    iconColor:'#386DB1'
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
        // backgroundColor: '#FFFFFF',
    },
    welcome: {
        fontSize: 20,
        textAlign: 'center',
        margin: 10,
    },
    instructions: {
        textAlign: 'center',
        color: '#333333',
        marginBottom: 5,
    },
});

export default styles;
export { colors, styles }