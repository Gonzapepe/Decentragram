// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

contract Decentragram {
    string public name = "Decentragram";
    // Guardar imagenes
    uint256 public imageCount = 0;
    mapping(uint256 => Image) public images;

    struct Image {
        uint256 id;
        string hash;
        string description;
        uint256 tipAmount;
        address payable author;
    }

    event ImageCreated(
        uint256 id,
        string hash,
        string description,
        uint256 tipAmount,
        address payable author
    );

    event ImageTipped(
        uint256 id,
        string hash,
        string description,
        uint256 tipAmount,
        address payable author
    );

    // Crear imágenes

    function uploadImage(string memory _imgHash, string memory _description)
        public
    {
        //asegurarse que la imagen exista
        require(bytes(_imgHash).length > 0);

        // Asegurarse que la descripcion exista
        require(bytes(_description).length > 0);

        // Asegurarse que el address exista
        require(msg.sender != address(0x0));
        // incrementar imageId
        imageCount++;

        // Añadir imágen al contrato
        images[imageCount] = Image(
            imageCount,
            _imgHash,
            _description,
            0,
            msg.sender
        );

        // Activar un evento
        emit ImageCreated(imageCount, _imgHash, _description, 0, msg.sender);
    }

    function tipImageOwner(uint256 _id) public payable {
        require(_id > 0 && _id <= imageCount);
        // Agarrar la imagen
        Image memory _image = images[_id];
        address payable _author = _image.author;

        // Pagar al autor enviandole Ether
        address(_author).transfer(msg.value);

        // Incrementar el tip Amount
        _image.tipAmount = _image.tipAmount + msg.value;

        // Actualizar imagen
        images[_id] = _image;

        // Activar un evento
        emit ImageTipped(
            _id,
            _image.hash,
            _image.description,
            _image.tipAmount,
            _author
        );
    }
}