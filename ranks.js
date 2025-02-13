module.exports = {

    root: {
        name: 'Root',
        perms: {
            seeAdmin: true,
            setRank: true,
            giveBan: true,
            deleteUser: true,
            moderateGallery: true,
            sendGallery: true,
            deleteGallery: true,
            updateNews: true,
            sendTarget: true,
        },
    },

    admin: {
        name: 'Админ',
        perms: {
            seeAdmin: true,
            giveBan: true,
            moderateGallery: true,
            sendGallery: true,
            updateNews: true,
        },
    },

    user: {
        name: 'Игрок',
        perms: {
            sendGallery: true,
        },
    },

    guest: {
        name: 'Пользователь'
    },

    // disabled all perms

    banned: {
        name: 'Забанен'
    }

}