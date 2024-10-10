export const ping = async () => window.api.ping();
export const checkDbConnection = async () => window.api.checkDbConnection();

export const articleApi = {
    create:             async (article)             => window.api.article.create(article),
    updateMainText:     async (id, newMainText)     => window.api.article.updateMainText(id, newMainText),
    updateExplanation:  async (id, newExplanation)  => window.api.article.updateExplanation(id, newExplanation),
    addImage:           async (id, newExplanation)  => window.api.article.addImage(id, newExplanation),
    getAll:             async ()                    => window.api.article.getAll(),
    getById:            async (id)                  => window.api.article.getById(id),
    deleteById:         async (id)                  => window.api.article.deleteById(id),
};

export const ownerApi = {
    create:             async (owner)               => window.api.owner.create(owner),
    updateName:         async (id, newName)         => window.api.owner.updateName(id, newName),
    getAll:             async ()                    => window.api.owner.getAll(),
    getById:            async (id)                  => window.api.owner.getById(id),    
    deleteById:         async (id)                  => window.api.owner.deleteById(id),
};

export const categoryApi = {
    create:             async (category)            => window.api.category.create(category),
    updateName:         async (id, newName)         => window.api.category.updateName(id, newName),
    updateColor:        async (id, newColor)        => window.api.category.updateColor(id, newColor),
    getAll:             async ()                    => window.api.category.getAll(),
    getById:            async (id)                  => window.api.category.getById(id),
    deleteById:         async (id)                  => window.api.category.deleteById(id)
};

export const commentApi = {
    updateText:         async (id, newText)         => window.api.comment.updateText(id, newText),
    getById:            async (id)                  => window.api.comment.getById(id),
};

export const imageApi = {
    getDataById:        async (id)                  => window.api.image.getDataById(id),
    getDataByPath:      async (image)               => window.api.image.getDataByPath(image),
    deleteById:         async (id)                  => window.api.image.deleteById(id),
};

export const tagApi = {
    create:             async (tag)                 => window.api.tag.create(tag),
    updateName:         async (id, newName)         => window.api.tag.updateName(id, newName),
    getAll:             async ()                    => window.api.tag.getAll(),
    getById:            async (id)                  => window.api.tag.getById(id),
    deleteById:         async (id)                  => window.api.tag.deleteById(id),
};
