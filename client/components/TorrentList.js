import React from 'react'
import moment from 'moment'
import { ListUl } from '@styled-icons/boxicons-regular/ListUl'
import { Upload } from '@styled-icons/boxicons-regular/Upload'
import { Download } from '@styled-icons/boxicons-regular/Download'
import { Chat } from '@styled-icons/boxicons-solid/Chat'
import List from './List'
import Text from './Text'

const TorrentList = ({ torrents = [], categories }) => (
  <List
    data={torrents.map((torrent) => ({
      ...torrent,
      href: `/torrent/${torrent.infoHash}`,
    }))}
    columns={[
      {
        header: 'Name',
        accessor: 'name',
        cell: ({ value, row }) => (
          <Text>
            {value}
            {row.freeleech && (
              <Text as="span" fontSize={0} color="primary" ml={3}>
                FL!
              </Text>
            )}
          </Text>
        ),
        gridWidth: '2fr',
      },
      {
        header: 'Category',
        accessor: 'type',
        cell: ({ value }) => (
          <Text icon={ListUl}>
            {categories.find((c) => c.slug === value)?.name || 'None'}
          </Text>
        ),
        gridWidth: '2fr',
      },
      {
        header: 'Seeders',
        accessor: 'seeders',
        cell: ({ value }) => <Text icon={Upload}>{value}</Text>,
        gridWidth: '1fr',
      },
      {
        header: 'Leechers',
        accessor: 'leechers',
        cell: ({ value }) => <Text icon={Download}>{value}</Text>,
        gridWidth: '1fr',
      },
      {
        header: 'Comments',
        accessor: 'comments.count',
        cell: ({ value }) => <Text icon={Chat}>{value || 0}</Text>,
        gridWidth: '1fr',
      },
      {
        header: 'Uploaded',
        accessor: 'created',
        cell: ({ value }) => <Text>{moment(value).format('Do MMM YYYY')}</Text>,
        gridWidth: '1fr',
        rightAlign: true,
      },
    ]}
  />
)

export default TorrentList
