/*
 * This file is part of KubeSphere Console.
 * Copyright (C) 2019 The KubeSphere Console Authors.
 *
 * KubeSphere Console is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * KubeSphere Console is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with KubeSphere Console.  If not, see <https://www.gnu.org/licenses/>.
 */

import React from 'react'
import { Icon, Progress } from '@pitrix/lego-ui'
import Upload from 'components/Base/Upload'
import Notify from 'components/Base/Notify'
import { isNumber, get, set } from 'lodash'
import classnames from 'classnames'
import { formatSize } from 'utils'

import BuilderStore from 'src/stores/s2i/builder'
import styles from './index.scss'

const headers = {
  'x-kubernetes-action': 'post',
  'x-kubernetes-group-version-kind':
    '{"group":"devops.kubesphere.io","version":"v1alpha1","kind":"S2iBinary"}',
}

class Uploader extends React.Component {
  constructor(props) {
    super(props)
    this.store = new BuilderStore()
    this.uploaderProps = {
      name: 's2ibinary',
      method: 'put',
      action: this.getUploadUrl,
      multiple: false,
      headers,
      ...(this.filesType === 'binary' ? {} : { accept: `.${this.filesType}` }),
      beforeUpload: this.beforeUploadHandler,
      onStart: this.startHandler,
      onSuccess: this.successHandler,
      onProgress: this.progressHandler,
      onError: this.errorHandler,
    }

    this.state = {
      files: this.uploadedfile
        ? { default: JSON.parse(this.uploadedfile) }
        : {},
    }
  }

  get filesType() {
    return get(this.props.formTemplate, 'metadata.annotations.languageType')
  }

  get uploadedfile() {
    return get(
      this.props.formTemplate,
      'metadata.annotations.["kubesphere.io/file"]'
    )
  }

  formatFileName = name => {
    this.binaryName =
      name.toLowerCase().replace(/([^a-zA-Z0-9])/g, '-') +
      Math.random()
        .toString(36)
        .slice(-4)
    return this.binaryName
  }

  setFileStatus = (fileId, fileStatus) => {
    this.setState(prevState => ({
      files: Object.assign({}, prevState.files, {
        [fileId]: Object.assign({}, prevState.files[fileId], fileStatus),
      }),
    }))
  }

  getUploadUrl = () =>
    `/kapis/devops.kubesphere.io/v1alpha2/namespaces/${
      this.props.namespace
    }/s2ibinaries/${this.binaryName}/file`

  beforeUploadHandler = async file => {
    const extensionName = file.name.slice(file.name.lastIndexOf('.') + 1)
    if (this.filesType !== 'binary' && extensionName !== this.filesType) {
      Notify.error(t('WRONG_FILE_EXTENSION_NAME', { type: this.filesType }))
      return Promise.reject(
        t('WRONG_FILE_EXTENSION_NAME', { type: this.filesType })
      )
    }
    return await this.store.creatBinary(
      this.formatFileName(file.name),
      this.props.namespace
    )
  }

  startHandler = file => {
    this.setFileStatus(file.uid, {
      size: file.size,
      name: file.name,
      showProgress: true,
      showFile: false,
      percentage: 0,
      status: 'active',
    })
  }

  progressHandler = (step, file) => {
    const percent = isNumber(step.percent) ? Math.round(step.percent) : 0
    this.setFileStatus(file.uid, {
      size: file.size,
      percentage: percent === 100 ? 99 : percent,
      status: 'active',
    })
  }

  successHandler = (res, file) => {
    const info = {
      name: file.name,
      size: file.size,
      showProgress: false,
      showFile: true,
      percentage: 100,
      status: 'active',
    }
    this.setFileStatus(file.uid, info)
    this.props.onChange(get(res, 'spec.downloadURL'))
    set(
      this.props.formTemplate,
      'metadata.annotations.["kubesphere.io/file"]',
      JSON.stringify(info)
    )
    Notify.success({
      content: t('Upload file success'),
    })
    this.props.uploadSuccess && this.props.uploadSuccess()
  }

  errorHandler = (err, res, file) => {
    this.setFileStatus(file.uid, {
      size: file.size,
      showProgress: true,
      showFile: false,
      status: 'exception',
    })
    Notify.error({
      content: t('Upload file failed'),
    })
  }

  handleReUpload = () => {
    Object.keys(this.state.files).forEach(id => {
      this.uploader.abort(id)
    })
    this.setState({ files: {} })
    this.props.onChange('')
    this.uploader.onClick()
  }

  renderProgress(fileId) {
    const { files } = this.state
    const file = files[fileId]

    return (
      <div className={styles.uploadingContent} key={fileId}>
        <p className={styles.fileInfo}>
          <span className={styles.fileName}>{file.name}</span>
          <span className={styles.uploadText}>
            {t('Upload percent')}: {file.percentage}%
          </span>
          <span className={styles.uploadText}>
            {t('File size')}: {formatSize(file.size)}
          </span>
        </p>
        <Progress
          className={styles.progress}
          percent={file.percentage}
          strokeWidth={8}
          key={fileId}
          showInfo={false}
        />
      </div>
    )
  }

  renderFileItem(fileId) {
    const { files } = this.state
    const file = files[fileId]

    return (
      <div className={styles.uploadingContent} key={fileId}>
        <p className={styles.fileInfo}>
          <span className={styles.fileName}>{file.name}</span>
          <span className={styles.uploadText}>{t('Upload percent')}: 100%</span>
          <span className={styles.uploadText}>
            {t('File size')}: {formatSize(file.size)}
          </span>
        </p>
        <Progress
          className={styles.progress}
          percent={100}
          strokeWidth={8}
          showInfo={false}
        />
      </div>
    )
  }

  render() {
    const { files } = this.state
    const UploadLength = Object.keys(files).length

    return (
      <div className={styles.container}>
        <Upload
          {...this.uploaderProps}
          ref={n => {
            this.uploader = n
          }}
        >
          <div
            className={classnames(styles.selectContainer, {
              [styles.none]: UploadLength,
            })}
          >
            <Icon
              className={styles.icon}
              size={40}
              name={this.filesType}
              type="coloured"
            />
            <p className={styles.title}>
              {t('Click to select the artifact file to upload')}
            </p>
            <p className={styles.desc}>
              {t(`${this.filesType.toUpperCase()}_DESC`)}
            </p>
          </div>
        </Upload>
        <div
          className={classnames(styles.uploadContainer, {
            [styles.none]: !UploadLength,
          })}
        >
          <Icon
            className={styles.icon}
            size={40}
            name={this.filesType}
            type="coloured"
          />
          {Object.keys(files).map(fileId => {
            if (!files[fileId]) return null
            if (files[fileId].showProgress) {
              return this.renderProgress(fileId)
            }
            if (files[fileId].showFile) {
              return this.renderFileItem(fileId)
            }
            return null
          })}
          <Icon
            changeable
            name="upload"
            onClick={this.handleReUpload}
            className={styles.uploadIcon}
          />
        </div>
      </div>
    )
  }
}

export default Uploader
