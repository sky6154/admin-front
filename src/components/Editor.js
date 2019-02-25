import React from 'react';
import {connect}          from "react-redux";
import {withRouter}       from "react-router";
import PropTypes          from 'prop-types';
import _                  from 'lodash';

import Editor, {composeDecorators} from 'draft-js-plugins-editor';
import createEmojiPlugin                                      from 'draft-js-emoji-plugin';
import createImagePlugin                                      from 'draft-js-image-plugin';
import createAlignmentPlugin                                  from 'draft-js-alignment-plugin';
import createFocusPlugin                                      from 'draft-js-focus-plugin';
import createResizeablePlugin                                 from 'draft-js-resizeable-plugin';
import createBlockDndPlugin                                   from 'draft-js-drag-n-drop-plugin';
import createToolbarPlugin, {Separator}                       from 'draft-js-static-toolbar-plugin';
import {
  ItalicButton,
  BoldButton,
  UnderlineButton,
  CodeButton,
  HeadlineOneButton,
  HeadlineTwoButton,
  HeadlineThreeButton,
  UnorderedListButton,
  OrderedListButton,
  BlockquoteButton,
  CodeBlockButton,
  // AlignBlockDefaultButton,
  // AlignBlockCenterButton,
  // AlignBlockLeftButton,
  // AlignBlockRightButton
}                                                             from 'draft-js-buttons';


import 'draft-js-emoji-plugin/lib/plugin.css';
import 'draft-js-static-toolbar-plugin/lib/plugin.css';
import 'draft-js-image-plugin/lib/plugin.css';
import 'draft-js-focus-plugin/lib/plugin.css';
import 'draft-js-alignment-plugin/lib/plugin.css';

import './css/Editor.css';
import {ImageAddButton}                                       from "./EditorImageAddButton";
import {
  AtomicBlockUtils,
  convertFromRaw,
  EditorState,
  convertToRaw,
  ContentState
}                                                             from 'draft-js';

import ReactFileReader from 'react-file-reader';
import {stateToHTML}   from 'draft-js-export-html';
import base64ToBlob    from '../utils/base64ToBlob';

import {uploadImageTrigger, replaceImageSrcTrigger, uploadPostTrigger, removeStateTrigger} from "../redux/actions/post";
import {fetchBoardListTrigger}                                                             from "../redux/actions/board";
import Alert                                                                               from "react-s-alert";
import TextField                                                                           from "@material-ui/core/es/TextField/TextField";
import MenuItem                                                                            from "@material-ui/core/es/MenuItem/MenuItem";

import {getRole}           from '../config/session';
import {isPermitted, Role} from '../config/Role';


const emojiPlugin = createEmojiPlugin();
const focusPlugin = createFocusPlugin();
const resizeablePlugin = createResizeablePlugin();
const blockDndPlugin = createBlockDndPlugin();
const alignmentPlugin = createAlignmentPlugin();
const staticToolbarPlugin = createToolbarPlugin();

const {Toolbar} = staticToolbarPlugin;
const {AlignmentTool} = alignmentPlugin;
const {EmojiSuggestions, EmojiSelect} = emojiPlugin;

const decorator = composeDecorators(
  resizeablePlugin.decorator,
  alignmentPlugin.decorator,
  focusPlugin.decorator,
  blockDndPlugin.decorator
);

const imagePlugin = createImagePlugin({decorator});

const plugins = [
  blockDndPlugin,
  focusPlugin,
  alignmentPlugin,
  resizeablePlugin,
  imagePlugin,
  emojiPlugin,
  staticToolbarPlugin
];

class MyEditor extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      editorState: EditorState.createEmpty(),
      boardId    : -1,
      title      : ''
    };

    // TODO
    // authCheckTrigger를 isPermitted에 넣어야 하는가, 권한 없으면 로그인으로 돌리는.....

    // let roles = getRole();
    // let requiredRoles = [Role.ROLE_ADMIN, Role.ROLE_BLOG];
    //
    // this.props.authCheckTrigger(this.props.history);
    //
    // if(!isPermitted(roles, requiredRoles)){
    //
    // }


  }



  handleFiles = files =>{
    const base64 = files.base64;
    const newEditorState = this.insertImageToEditor(this.state.editorState, base64);

    this.setState({editorState: newEditorState});
  };

  insertImageToEditor = (editorState, base64) =>{
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(
      'image',
      'IMMUTABLE',
      {src: base64},
    );
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = EditorState.set(
      editorState,
      {currentContent: contentStateWithEntity},
    );
    return AtomicBlockUtils.insertAtomicBlock(newEditorState, entityKey, ' ');
  };

  handleSubmit = () =>{
    const content = this.state.editorState.getCurrentContent();
    const dataToSaveBackend = convertToRaw(content);

    if(this.state.title === ''){
      Alert.error("제목을 입력하여 주세요.", {
        position: 'top-right',
        effect  : 'slide',
        timeout : 3000
      });
    }
    else{
      if(!_.isNil(dataToSaveBackend)){
        this.uploadImages(dataToSaveBackend.entityMap);
      }
    }

  };

  // getSnapshotBeforeUpdate(prevProps, prevState) {
  //   console.log(prevProps);
  //
  //   return null;
  // }

  static getDerivedStateFromProps(props, state) {
    if(props.isPostProgress && props.step1IsAllImageUploaded && props.step2IsDoneReplaceSrc && props.step3IsPostUpload){
      const editorState = EditorState.push(state.editorState, ContentState.createFromText(''));

      return {
        editorState : editorState,
        title : ''
      }
    }

    return null;
  }

  componentDidMount(){
    this.props.fetchBoardListTrigger();
  }

  componentDidUpdate(prevProps, prevState, snapshot){
    if(this.state.boardId === -1 && !_.isNil(this.props.boardList) && !_.isEmpty(this.props.boardList)){
      this.setState({boardId : this.props.boardList[0].boardId});
    }

    if(this.props.isPostProgress && this.props.step1IsAllImageUploaded && this.props.step2IsDoneReplaceSrc && this.props.step3IsPostUpload){
      console.log("STEP 3");
      this.props.removeStateTrigger();
      // this.clearContent();
    }
    else if(this.props.isPostProgress && this.props.step1IsAllImageUploaded && this.props.step2IsDoneReplaceSrc && !this.props.isPostUploading && !this.props.step3IsPostUpload){
      console.log("STEP 2");
      this.uploadPost();
    }
    else if(this.props.isPostProgress && this.props.step1IsAllImageUploaded && !this.props.isReplaceSrc && !this.props.step2IsDoneReplaceSrc && !this.props.step3IsPostUpload){
      console.log("STEP 1");
      this.replaceImages(this.props.imageUploadInfo);
    }


    // 이미지 업로드 완료
    // if(isPostProgress && step1)

    // 이미지 업로드 src replace 완료
    // if(isPostProgress && step1 && step2)

    // 포스트 다 업로드 완료
    // if(isPostProgress && step1 && step2 && step3)

    // 이후 handling ..?
  }

  handleTargetBoard = () => event =>{
    this.setState({boardId: event.target.value});
  };

  handleTitle = (event) =>{
    this.setState({title: event.target.value});
  };

  printBoardList = (boardList) =>{
    if(!_.isNil(boardList) && boardList.length > 0){

      return <TextField
        id="outlined-select-currency"
        select
        label="Board list"
        className={"textField"}
        value={this.state.boardId}
        onChange={this.handleTargetBoard()}
        SelectProps={{
          MenuProps: {
            className: "menu",
          },
        }}
        margin="normal"
        variant="outlined"
        style={{width: 200}}
      >
          {boardList.map(boardInfo => (
            <MenuItem key={boardInfo.description} value={boardInfo.boardId}>
              {boardInfo.description}
            </MenuItem>
          ))}
        </TextField>;
    }
  };

  uploadImages = (entityMap) =>{
    let formData = new FormData();

    if(!_.isNil(entityMap)){
      Object.keys(entityMap).map(function (key){
        let data = entityMap[key].data.src;
        let block = data.split(";");

        let contentType = block[0].split(":")[1]; // ex) "image/gif"
        let realData = block[1].split(",")[1]; // ex) "R0lGODlhPQBEAPeoAJosM...."

        let fileFormat = contentType.split("/")[1]; // ex) png
        let fileName = parseInt(key) + 1;

        let blob = base64ToBlob(realData, contentType);
        // blob에 아래 두 properties를 추가하면 file과 같은 형태가 된다.
        blob.lastModifiedDate = new Date();
        blob.contentType = contentType;

        let file = new File([blob], fileName + '.' + fileFormat);

        formData.append('files', file);
      });

      // 버튼 다시 못누르게 이미지 업로드가 아니라 포스팅 진행중일때로 한다.
      if(!this.props.isPostProgress){
        this.props.uploadImageTrigger(formData);
      }
      else{
        Alert.warning("작업 진행중 입니다.", {
          position: 'top-right',
          effect  : 'slide',
          timeout : 3000
        });
      }
    }
  };

  replaceImages = (fileInfo) =>{
    const content = this.state.editorState.getCurrentContent();
    const dataToSaveBackend = convertToRaw(content);

    if(!_.isNil(dataToSaveBackend)){
      let req = {
        fileInfo : fileInfo,
        entityMap: dataToSaveBackend.entityMap
      };

      if(!this.props.isReplaceSrc){
        this.props.replaceImageSrcTrigger(req);
      }
      else{
        Alert.warning("작업 진행중 입니다.", {
          position: 'top-right',
          effect  : 'slide',
          timeout : 3000
        });
      }
    }
  };

  uploadPost = () =>{
    let content = stateToHTML(this.state.editorState.getCurrentContent());

    let req = {
      boardId: this.state.boardId,
      title  : this.state.title,
      content: content
    };

    this.props.uploadPostTrigger(req);
  };


  onChange = (editorState) =>{
    this.setState({
      editorState,
    });
  };

  focus = () =>{
    this.editor.focus();
  };

  render(){
    let boardListDropDown = this.printBoardList(this.props.boardList);

    return (
      <div>
        {boardListDropDown}

        <TextField
          id="standard-full-width"
          label="제목"
          placeholder="제목을 입력하세요."
          fullWidth
          margin="normal"
          onChange={this.handleTitle}
          value={this.state.title}
          variant="outlined"
        />
        <Toolbar>
            {
              // may be use React.Fragment instead of div to improve perfomance after React 16
              (externalProps) => (
                <div>
                  <BoldButton {...externalProps} />
                  <ItalicButton {...externalProps} />
                  <UnderlineButton {...externalProps} />
                  <CodeButton {...externalProps} />
                  <Separator {...externalProps} />
                  <HeadlinesButton {...externalProps} />
                  <UnorderedListButton {...externalProps} />
                  <OrderedListButton {...externalProps} />
                  <BlockquoteButton {...externalProps} />
                  <CodeBlockButton {...externalProps} />
                  {/*<AlignBlockDefaultButton {...externalProps} />*/}
                  {/*<AlignBlockCenterButton {...externalProps} />*/}
                  {/*<AlignBlockLeftButton {...externalProps} />*/}
                  {/*<AlignBlockRightButton {...externalProps} />*/}
                </div>
              )
            }
          </Toolbar>
        <div className={"editor"} onClick={this.focus}>
          <Editor
            editorState={this.state.editorState}
            onChange={this.onChange}
            plugins={plugins}
            ref={(element) =>{
              this.editor = element;
            }}
          />
          <AlignmentTool />
          <EmojiSuggestions />
        </div>
        <div className={"options"}>
          <EmojiSelect />
          <ImageAddButton editorState={this.state.editorState}
                          onChange={this.onChange}
                          modifier={imagePlugin.addImage} />
          <div style={{display: "inline-block"}} className={"addImage"}>
            <ReactFileReader fileTypes={[".jpg", ".jpeg", ".png"]} base64={true} handleFiles={this.handleFiles}
                             multipleFiles={false}>
              <button className={"addImageButton"} style={{width: "100px"}}>Upload</button>
            </ReactFileReader>
          </div>
        </div>
        <div style={{float: "right"}} className={"addImage"}>
          <button className={"addImageButton"} style={{width: "100px"}} onClick={this.handleSubmit}>Submit</button>
        </div>
      </div>
    );
  }
}


class HeadlinesPicker extends React.Component {
  componentDidMount(){
    setTimeout(() =>{
      window.addEventListener('click', this.onWindowClick);
    });
  }

  componentWillUnmount(){
    window.removeEventListener('click', this.onWindowClick);
  }

  onWindowClick = () =>
    // Call `onOverrideContent` again with `undefined`
    // so the toolbar can show its regular content again.
    this.props.onOverrideContent(undefined);

  render(){
    const buttons = [HeadlineOneButton, HeadlineTwoButton, HeadlineThreeButton];
    return (
      <div>
        {buttons.map((Button, i) => // eslint-disable-next-line
          <Button key={i} {...this.props} />
        )}
      </div>
    );
  }
}

class HeadlinesButton extends React.Component {
  onClick = () =>
    // A button can call `onOverrideContent` to replace the content
    // of the toolbar. This can be useful for displaying sub
    // menus or requesting additional information from the user.
    this.props.onOverrideContent(HeadlinesPicker);

  render(){
    return (
      <div className={"headlineButtonWrapper"}>
        <button onClick={this.onClick} className={"headlineButton"}>
          H
        </button>
      </div>
    );
  }
}


MyEditor.defaultProps = {
  isPostProgress            : false,
  isImageUploading          : false,
  isReplaceSrc              : false,
  isPostUploading           : false,
  step1IsAllImageUploaded   : false,
  step2IsDoneReplaceSrc     : false,
  step3IsPostUpload         : false,
  imageUploadInfo           : [],
  isFetchBoardListRequesting: false,
  boardList                 : []
};

MyEditor.propTypes = {
  isPostProgress            : PropTypes.bool.isRequired,
  isImageUploading          : PropTypes.bool.isRequired,
  isReplaceSrc              : PropTypes.bool.isRequired,
  isPostUploading           : PropTypes.bool.isRequired,
  step1IsAllImageUploaded   : PropTypes.bool.isRequired,
  step2IsDoneReplaceSrc     : PropTypes.bool.isRequired,
  step3IsPostUpload         : PropTypes.bool.isRequired,
  imageUploadInfo           : PropTypes.array.isRequired,
  isFetchBoardListRequesting: PropTypes.bool.isRequired,
  boardList                 : PropTypes.array.isRequired
};

function mapStateToProps(state){
  return {
    isPostProgress            : state.post.isPostProgress,
    isImageUploading          : state.post.isImageUploading,
    isReplaceSrc              : state.post.isReplaceSrc,
    isPostUploading           : state.post.isPostUploading,
    step1IsAllImageUploaded   : state.post.step1IsAllImageUploaded,
    step2IsDoneReplaceSrc     : state.post.step2IsDoneReplaceSrc,
    step3IsPostUpload         : state.post.step3IsPostUpload,
    imageUploadInfo           : state.post.imageUploadInfo,
    isFetchBoardListRequesting: state.board.isFetchBoardListRequesting,
    boardList                 : state.board.boardList
  };
}

export default withRouter(connect(mapStateToProps, {
  uploadImageTrigger, replaceImageSrcTrigger, uploadPostTrigger, removeStateTrigger,
  fetchBoardListTrigger
})(MyEditor));
