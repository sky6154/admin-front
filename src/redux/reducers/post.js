import * as actionTypes from '../actions/post';
import createReducer from '../utils/createReducer';
import Alert from 'react-s-alert';
import _ from "lodash";
import {removeSessionInfo} from "../../config/session";

const initialState = {
    isPostProgress: false,
    isImageUploading: false,
    isReplaceSrc: false,
    isPostUploading: false,
    step1IsAllImageUploaded: false,
    step2IsDoneReplaceSrc: false,
    step3IsPostUpload: false,
    imageUploadInfo: []
};

const actionHandlers = {
    [actionTypes.UPLOAD_IMAGE.REQUEST]: (state, action) => {
        return Object.assign({}, state, {isImageUploading: true});
    },
    [actionTypes.UPLOAD_IMAGE.SUCCESS]: (state, action) => {
        return Object.assign({}, state, {
            isImageUploading: false,
            step1IsAllImageUploaded: true,
            imageUploadInfo: action.data,
            isPostProgress: true
        });
    },
    [actionTypes.UPLOAD_IMAGE.FAILURE]: (state, action) => {
        Alert.error("IMAGE UPLOAD FAIL", {
            position: 'top-right',
            effect: 'slide',
            timeout: 3000
        });

        removeSessionInfo();

        // ...initialkState 가 아니라 그냥 전체 Post쪽 정보를 초기화 한다.
        return Object.assign({}, state, initialState);
    },


    [actionTypes.REPLACE_IMAGE_SRC.REQUEST]: (state, action) => {
        return Object.assign({}, state, {isReplaceSrc: true});
    },
    [actionTypes.REPLACE_IMAGE_SRC.SUCCESS]: (state, action) => {
        const imageUploadResult = action.data;

        return Object.assign({}, state, {
            isReplaceSrc: false,
            step2IsDoneReplaceSrc: true
        });
    },
    [actionTypes.REPLACE_IMAGE_SRC.FAILURE]: (state, action) => {
        return Object.assign({}, state, initialState);
    },


    [actionTypes.UPLOAD_POST.REQUEST]: (state, action) => {
        return Object.assign({}, state, {isPostUploading: true});
    },
    [actionTypes.UPLOAD_POST.SUCCESS]: (state, action) => {
        const imageUploadResult = action.data;

        return Object.assign({}, state, {
            isPostUploading: false,
            step3IsPostUpload: true
        });
    },
    [actionTypes.UPLOAD_POST.FAILURE]: (state, action) => {
        removeSessionInfo();

        return Object.assign({}, state, initialState);
    },


    [actionTypes.REMOVE_STATE.SUCCESS]: (state, action) => {
        return Object.assign({}, state, initialState);
    }
};

export default createReducer(initialState, actionHandlers);